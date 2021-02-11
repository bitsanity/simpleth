// - An ADILOS Message contains 1..n MessageParts
//
// - Each MessagePart is a byte sequence:
//
//     length : an unsigned byte indicating the remaining length of the part
//     key : an array of bytes beginning with a 0x02 0x03 or 0x04 to indicate
//           the pubkey length
//     sig : an ECDSA signature in DER-format (variable length)

const b64codec = require( 'base64-js' );
const secp256k1 = require( 'secp256k1' );
const hashlib = require( 'hash.js' );

exports.fromHexString = function( hexString ) {
  if (/^0x/.test(hexString)) hexString = hexString.substring(2);
  return new
    Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

exports.toHexString = function( uint8arr ) {
  return Buffer.from(uint8arr).toString('hex');
}

function concat(a, b) {
  var c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

exports.parse = function( b64msg ) {
  if (null == b64msg || 0 == b64msg.length) return null;

  let raw = Uint8Array.from( b64codec.toByteArray(b64msg) );

  let ix = 0;
  let parts = [];

  while( ix < raw.length ) {
    let len = raw[ix];
    let keytype = raw[ix+1];
    let key = null;

    if (keytype < 2 || keytype > 4) { // should be 02, 03 or 04
      console.log( "invalid key type: " + keytype );
      return null;
    }

    if (keytype == 4) {
      key = raw.subarray( ix + 1, ix + 1 + 65 );
    } else {
      key = raw.subarray( ix + 1, ix + 1 + 33 );
    }

    let sig = raw.subarray( ix + 1 + key.length, ix + len + 1 );
    parts.push( { pubkey: key, signature: sig } );
    ix = ix + len + 1;
  }

  // verify all signatures in the signature chain
  for (let ii = parts.length - 1; ii >= 0; ii--) {

    let vsig = parts[ii].signature;
    let vkey = parts[ii].pubkey;
    let vhash = null;

    if (0 == ii) {
      // this part is Challenge - verify it signed own pubkey
      vhash = new Uint8Array( hashlib.sha256().update(parts[0].pubkey).digest() );
    } else {
      // this part is chained verify it signed previous signature in the chain
      vhash =
        new Uint8Array( hashlib.sha256().update(parts[ii-1].signature).digest() );
    }

    // ADILOS and Bitcoin world use DER-encoded signatures but the javascript
    // secp256k1 and elliptic libraries use r,s,v format
    let ellsig = new Uint8Array(64);
    secp256k1.signatureImport( vsig, ellsig );

    if (!secp256k1.ecdsaVerify( ellsig, vhash, vkey )) {
      console.log( "failed sig [" + ii + "]" );
      return null;
    }
  }

  return parts;
}

exports.agentInChallenge = function( chB64 ) {
  let parts = module.exports.parse( chB64 );
  if (!parts || parts.length == 0) return false;
  return parts.length == 2;
}

// input:
//   [ { pubkey: Uint8Array, signature: Uint8Array }, ... ]
//
// output:
//   Base64-encoded string representation of concatenated parts

exports.toMessage = function( partsarr ) {
  if (!partsarr) return null;

  let result = new Uint8Array();

  for (let ii = 0; ii < partsarr.length; ii++) {
    let part = partsarr[ii];
    let key = part.pubkey;
    let sig = part.signature;

    let thispart = new Uint8Array( 1 + key.length + sig.length );
    thispart.set( [key.length + sig.length] , 0 );
    thispart.set( key, 1 );
    thispart.set( sig, key.length + 1 );
    result = concat( result, thispart );
  } // end foreach part

  return b64codec.fromByteArray( result );
}

exports.makeChallenge = function( sesskey ) {
  // ADILOS recognizes both compressed and uncompressed. use compressed
  let pubk = secp256k1.publicKeyCreate( sesskey, true );

  let hasher = hashlib.sha256();
  hasher.update( pubk );
  let msg32 = Uint8Array.from( hasher.digest() );

  let sig = Uint8Array.from( secp256k1.ecdsaSign(msg32, sesskey).signature );
  let dersig = new Uint8Array(72); // ADILOS expects DER-encoded format
  let outobj = secp256k1.signatureExport( sig, dersig );

  return module.exports.toMessage( [ {pubkey: pubk, signature: outobj }] );
}

exports.makeResponse = function( challB64, pvkey ) {

  let parts = module.exports.parse( challB64 );
  if (!parts || parts.length == 0 || parts.length > 2) {
    return null;
  }

  let pubk = secp256k1.publicKeyCreate( pvkey, true );

  // authenticate by signing the last signature in the challenge
  let last = parts[parts.length - 1];

  let hasher = hashlib.sha256();
  hasher.update( last.signature );
  let msg32 = Uint8Array.from( hasher.digest() );

  let sig = Uint8Array.from( secp256k1.ecdsaSign(msg32, pvkey).signature );
  let dersig = new Uint8Array(72); // ADILOS expects DER-encoded format
  let outobj = secp256k1.signatureExport( sig, dersig );
  parts.push( { pubkey: pubk, signature: outobj } );

  return module.exports.toMessage( parts );
}

// returns public key of responder if the response is valid, null otherwise
exports.validateResponse = function( rspB64, challB64 ) {

  let rspParts = module.exports.parse( rspB64 );
  let chgParts = module.exports.parse( challB64 );

  if (!rspParts || rspParts.length < 2 || rspParts.length > 3) {
    console.log( "invalid response: " + JSON.stringify(rspParts) );
    return null;
  }

  if (!chgParts || chgParts.length < 1 || chgParts.length > 2) {
    console.log( "invalid challenge: " + JSON.stringify(chgParts) );
    return null;
  }

  let chgPart = chgParts[0];
  let rspPart = rspParts[0];

  // parse() already verified the signature chains - here just verify
  // the first pubkey in the challenge matches the first pubkey in the response

  if (JSON.stringify(chgPart.pubkey) === JSON.stringify(rspPart.pubkey)) {
    // user's (keymaster) pubkey is the last pubkey in the response chain
    return rspParts[rspParts.length - 1].pubkey;
  }

  return null;
}

exports.selfTest = function() {
  // gatekeeper's private key for this challenge/session
  var sesspriv = module.exports.fromHexString(
    "0xd19fb024be3981d81f6313da7c73d0bd05dc6390ce7cb44be4bc12c7e7bc0cc0" );

  let chB64 = module.exports.makeChallenge( sesspriv );

  console.log( "Challenge:\n\n" + chB64 + "\n\n" );

  // pretend some keymaster made this keypair independently
  var privk = "0xc85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4";
  var pubk = "030947751e3022ecf3016be03ec77ab0ce3c2662b4843898cb068d74f698ccc8ad";

  let rspB64 =
    module.exports.makeResponse( chB64, module.exports.fromHexString(privk) );

  let apubkey =
    module.exports.toHexString( module.exports.validateResponse(rspB64, chB64) );

  if (apubkey === pubk)
    console.log( "PASS" );
  else
    console.log( "FAIL\nExpected: " + pubk + "\nGot: " + usrpub );
}
