import { Buffer } from 'buffer';
global.Buffer = Buffer; // very important for React Native

import * as React from 'react';
import { Button,
         Clipboard,
         Component,
         FlatList,
         Image,
         ScrollView,
         StyleSheet,
         Text,
         TextInput,
         TouchableOpacity,
         View
       } from 'react-native';

import RadioForm, {RadioButton, RadioButtonInput, RadioButtonLabel}
  from 'react-native-simple-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CameraKitCameraScreen } from 'react-native-camera-kit';
import QRCode from 'react-native-qrcode-svg';

const Stack = createStackNavigator();
const b64codec = require( 'base64-js' );
const hashlib = require( 'hash.js' );
const secp256k1 = require( 'secp256k1' );
const aesjs = require( 'aes-js' );
const ethers = require( 'ethers' ).utils;
const adilos = require( './adilos' );

const keyimg = require('./img/keylogo.png');
const keyicon = require('./img/keyicon.png');
const copyicon = require('./img/copyicon.png');
const restoreicon = require('./img/restoreicon.png');

var locale = "en";
var strings = {
  "en": {
    AppName:"SIMPLΞTH",
    SplashName:"Home",
    SplashGoButton:"Enter",
    PIN:"PIN",
    EnterPIN:"Please Enter Your 6-Digit Code:",
    KeyList:"Key List",
    ShowAs:"Show Key As:",
    NewKeyButton:"New Key",
    BackupButton:"Backup/Restore",
    Backup:"Backup",
    BackupInstructions:"Click 'Copy' button to copy your encrypted wallet to the clipboard. Paste it in a safe location of your choice. You will need that same data AND your current PIN to restore your wallet.",
    CopyButton:"Copy",
    RestoreButton:"Restore",
    RestoreInstructions:"WARNING: This will overwrite simpleth's current data and destroy any keys in your app now. Please be certain. Enter previous backup data below, then click 'Restore'. There is no undo.",
    ClickBtnsPrompt:"Click each button, any order:",
    NewKeyName:"New Key Name:",
    OkayButton:"OKAY",
    CancelButton:"CANCEL",
    KeyDetails:"Key Details",
    KeyDetailsLabel:"Key:",
    IdentifyButton:"Identify",
    SignSpendButton:"Sign Hash",
    ScanQR:"Scan QR",
    ResponseNotice:"Show This Response",
    ToChallenger:"to Challenger",
    SignSpendWarn:"WARNING: May Spend Funds.",
    NotADILOS:"ERROR: Not ADILOS Challenge",
    BadHashLen:"ERROR: Hash should be 32 bytes"
  }
}

const keyborders = ['black','darkblue','darkred','darkgreen','purple'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: "#f2f2f2"
  },
  keylogo: {
    width: 140,
    height: 65
  },
  splashtext: {
    marginTop: 30,
    fontWeight: 'bold'
  },
  allbuttons: {
    borderWidth: 2,
    borderRadius: 10,
    borderColor: 'darkgreen'
  },
  btntext: {
    color: 'darkgreen',
    fontWeight: 'bold',
    textAlign:'center'
  },
  gobutton: {
    marginTop: 100,
    padding: 10
  },
  oktext: {
    color: 'darkgreen'
  },
  warntext: {
    color: 'darkred',
  },
  warnbutton: {
    borderColor: 'darkred'
  },
  txtlabel: {
    fontWeight: 'bold',
    fontSize: 20,
    padding: 20
  },
  txtdata: {
    fontFamily:'monospace',
    fontSize: 12
  },
  pinbutton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    marginRight: 15,
    width: 60,
    height: 40,
    backgroundColor: '#ececec'
  },
  pinindicator: {
    height:25,
    width:25,
    marginLeft:5,
    marginRight:5,
    borderWidth:1,
    borderRadius:12,
    borderColor:'black',
    marginTop: 25
  },
  keygamebtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
    width: 60,
    height: 40,
    backgroundColor: '#ececec'
  },
  textinput: {
    width:250,
    fontFamily:'monospace',
    height:40,
    borderColor:'gray',
    borderWidth:2,
    color:'darkgreen'
  },
});

function symmetricKey() {
  let hasher = hashlib.sha256();
  hasher.update( global.PIN );
  return hasher.digest();
}

const blackToRed = (b64) => {
  try {
    let blkbytes = b64codec.toByteArray( b64 );
    let aes =
      new aesjs.ModeOfOperation.ctr( symmetricKey(), new aesjs.Counter(5) );
    let redbytes = aes.decrypt( blkbytes );
    return aesjs.utils.utf8.fromBytes( redbytes );
  } catch(e) {
    console.log( "blackToRed fail: " + e.toString() );
  }
  return null;
}

const getStoredData = async () => {
  global.simpleth = null;

  try {
    let value = await AsyncStorage.getItem( "simpleth" );
    if (value !== null) {
      let redtxt = blackToRed( value );
      if (redtxt != null) {
        global.simpleth = JSON.parse(redtxt);
      }
    }
    else {
      storeData(); // this must be first run - initialize storage
    }
  } catch(e) {
    console.log( "FAIL reading storage: " + e );
  }
}
 
const redToBlack = () => {
  try {
    let redtxt = JSON.stringify( global.simpleth );
    let redbytes = aesjs.utils.utf8.toBytes( redtxt );
    let aes =
      new aesjs.ModeOfOperation.ctr( symmetricKey(), new aesjs.Counter(5) );
    let blkbytes = aes.encrypt( redbytes );
    return b64codec.fromByteArray( blkbytes );
  } catch(e) {
    console.log( "redToBlack fail: " + e );
  }
  return null;
}

const storeData = async () => {
  try {
    if (!global.simpleth) {
      global.simpleth = { wallet: [] };
    }

    let blktxt = redToBlack();
    await AsyncStorage.setItem( 'simpleth', blktxt );
  } catch (e) {
    console.log( "FAIL saving to storage:" + e.toString() );
  }
}

function SplashScreen({navigation}) {
  return (
    <View style={styles.container}>
      <Image style={styles.keylogo} source={keyimg} />
      <Text style={styles.splashtext}>{strings[locale].AppName}</Text>
      <TouchableOpacity
          style={[styles.allbuttons, styles.gobutton]}
          onPress={() => navigation.navigate('PINPad')}>
        <Text style={styles.btntext}>{strings[locale].SplashGoButton}</Text>
      </TouchableOpacity>
    </View>
  );
}

class PINPadScreen extends React.Component {

  constructor({navigation}) {
    super();
    this.nav = navigation;
    this.digit = this.digit.bind(this);
    this.pinIndBackground = this.pinIndBackground.bind(this);
    this.pin = [];
  }

  digit( d ) {
    if (d == 'C') {
      this.pin = [];
    } else if (d == 'D') {
      this.pin.pop();
    } else if (this.pin.length < 6) {
      this.pin.push( d );
    }
    this.forceUpdate();

    if (this.pin.length == 6) {
      global.PIN = this.pin.join("");
      getStoredData();

      setTimeout( () => {
        if (global.simpleth)
          this.nav.navigate( 'KeyList' );
        else
          this.nav.popToTop();
      }, 500 );
    }
  }

  pinIndBackground( ix ) {
    return (this.pin.length >= ix)
      ? {backgroundColor:'darkgreen'}
      : {backgroundColor:'#efefef'}
  }

  render() {
    return (
    <View style={styles.container}>
      <View style={{ flex:1 }}></View>
      <Text style={styles.txtlabel}>{strings[locale].EnterPIN}</Text>
      <View style={{ flex: 1,
                     flexDirection:'column',
                     alignItems: 'center',
                     justifyContent: 'center' }}>
        <View style={{ flex:1, flexDirection:'row',
                       maxHeight:50, justifyContent:'space-between' }}>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('1')}>
            <Text style={styles.btntext}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('2')}>
            <Text style={styles.btntext}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('3')}>
            <Text style={styles.btntext}>3</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex:1, flexDirection:'row',
                       maxHeight:50, justifyContent:'space-between'}}>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('4')}>
            <Text style={styles.btntext}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('5')}>
            <Text style={styles.btntext}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('6')}>
            <Text style={styles.btntext}>6</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex:1, flexDirection:'row',
                       maxHeight:50, justifyContent:'space-between'}}>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('7')}>
            <Text style={styles.btntext}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('8')}>
            <Text style={styles.btntext}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('9')}>
            <Text style={styles.btntext}>9</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex:1, flexDirection:'row',
                       maxHeight:50, justifyContent:'space-between'}}>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('C')}>
            <Text style={styles.btntext}>CLR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('0')}>
            <Text style={styles.btntext}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.allbuttons, styles.pinbutton]}
            onPress={() => this.digit('D')}>
            <Text style={styles.btntext}>DEL</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex:1, flexDirection:'row',
                     maxHeight:50, justifyContent:'space-between'}}>
        <View style={ [styles.pinindicator, this.pinIndBackground(1)] }></View>
        <View style={ [styles.pinindicator, this.pinIndBackground(2)] }></View>
        <View style={ [styles.pinindicator, this.pinIndBackground(3)] }></View>
        <View style={ [styles.pinindicator, this.pinIndBackground(4)] }></View>
        <View style={ [styles.pinindicator, this.pinIndBackground(5)] }></View>
        <View style={ [styles.pinindicator, this.pinIndBackground(6)] }></View>
      </View>
      <View style={{ flex:1 }}></View>
    </View>
  );
  }
}

class KeyListScreen extends React.Component {

  constructor({navigation}) {
    super();
    this.renderKeyItem = this.renderKeyItem.bind(this)
    this.nav = navigation;
    this.ix = 0;
  }

  renderKeyItem({item}) {
    let bcol = keyborders[ this.ix++ % keyborders.length ];

    return (
      <TouchableOpacity
        style={[ styles.allbuttons,styles.container,
                 {marginTop:20,borderColor:bcol} ]}
        onPress={ () => this.nav.navigate('KeyDetails', item) }>
        <Image source={keyicon} />
        <Text style={[styles.btntext,
                      {marginTop:10,color:bcol}]}>{item.keyname}</Text>
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <View style={styles.container}>

        <Text style={ styles.txtlabel }>{strings[locale].KeyList}</Text>

        <FlatList data={global.simpleth.wallet}
                  renderItem={this.renderKeyItem}
                  style={ {height:450,flexGrow:0} }
                  keyExtractor={(item) => item.privkey} />

        <View style={ [styles.container, {flexDirection:'row'} ]}>
          <TouchableOpacity
            style={ [styles.allbuttons,
                    {backgroundColor:'#e9e9e9',marginTop:50} ]}
            onPress={() => this.nav.navigate('NewKey')} >
            <Text style={[styles.btntext, {padding:10}]}>
              {strings[locale].NewKeyButton}
            </Text>
          </TouchableOpacity>

          <View style={ {width:50} } />

          <TouchableOpacity
            style={ [styles.allbuttons,
                    {backgroundColor:'#e9e9e9',marginTop:50} ]}
            onPress={() => this.nav.navigate('BackupRestore')} >
            <Text style={[styles.btntext, {padding:10}]}>
              {strings[locale].BackupButton}
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    );
  }
}

class KeyNameDialog extends React.Component {
  constructor({route, navigation}) {
    super();
    this.nav = navigation;
    this.keyhash = '' + route.params.keyhash;
    this.setText = this.setText.bind( this );
    this.okay = this.okay.bind( this );
  }

  setText(txt) {
    this.value = txt;
  }

  okay() {
    if (!this.value || this.value.length == 0) return;

    for( let ii = 0; ii < global.simpleth.wallet.length; ii++ )
      if (this.value == global.simpleth.wallet[ii].keyname) return;

    let it = { keyname:this.value, privkey:this.keyhash };

    global.simpleth.wallet.push( it );
    storeData();

    setTimeout( () => {this.nav.popToTop()}, 500 );
  }

  cancel() {
    this.nav.navigate( 'KeyList' );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={ styles.container } />

        <Text style={styles.txtlabel}>{strings[locale].NewKeyName}</Text>
        <TextInput style={styles.textinput}
          onChangeText={ (text) => {this.setText(text)} }>
        </TextInput>

        <View style={ [styles.container, {flexDirection:'row'} ]}>
          <TouchableOpacity
            style={ [styles.allbuttons,
                    {backgroundColor:'#e9e9e9',marginTop:50} ]}
            onPress={ () => {this.okay()} } >
            <Text style={[styles.btntext, {padding:10,width:80}]}>
              {strings[locale].OkayButton}
            </Text>
          </TouchableOpacity>

          <View style={ {width:50} } />

          <TouchableOpacity
            style={ [styles.allbuttons, styles.warnbutton,
              {backgroundColor:'#e9e9e9',marginTop:50} ]}>
            <Text style={[styles.btntext,styles.warntext,
              {padding:10,width:80}]}>
              {strings[locale].CancelButton}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={ styles.container } />
      </View>
    );
  }
}

class NewKeyScreen extends React.Component {

  constructor({navigation}) {
    super();
    this.nav = navigation;
    this.btnpress = this.btnpress.bind( this );
    this.data = [
      ["0","1","2","3"],
      ["4","5","6","7"], 
      ["8","9","A","B"], 
      ["C","D","E","F"]
    ]; 
    this.keyhash =
      "0000000000000000000000000000000000000000000000000000000000000000";
    this.showDialog = false;
  }

  btnpress(x,y) {
    this.data[x][y] = "";

    let done = true;
    for( let row = 0; row < this.data.length; row++ )
      for( let col = 0; col < this.data[0].length; col++ )
        if (this.data[row][col] != '') done = false;

    if (done) {
      // KNOWN TEST VECTOR =====
      //this.keyhash =
      //  "0bce878dba9cce506e81da71bb00558d1684979711cf2833bab06388f715c01a";

      this.nav.navigate('NewKeyName',{keyhash:this.keyhash} );
    }

    // combine computer random plus user's randomish sequence and sorta random
    // millisecond, then hash it all together to make something random enough

    let newrand = crypto.getRandomValues( new Uint8Array(32) );
    let hasher = hashlib.sha256();

    hasher.update( this.keyhash, 'hex' );
    hasher.update( newrand );
    hasher.update( new Date().getTime() );
    hasher.update( '' + x + '' + y );
    this.keyhash = hasher.digest('hex');

    this.forceUpdate();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{ flex:1 }}></View>
        <Text style={styles.txtlabel}>{strings[locale].ClickBtnsPrompt}</Text>

        <View style={{ flex: 1,
                       flexDirection:'column',
                       alignItems: 'center',
                       justifyContent: 'center' }}>

          <View style={{ flex:1, flexDirection:'row',
                         maxHeight:50, justifyContent:'space-between' }}>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(0,0)}>
              <Text style={styles.btntext}>{this.data[0][0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(0,1)}>
              <Text style={styles.btntext}>{this.data[0][1]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(0,2)}>
              <Text style={styles.btntext}>{this.data[0][2]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(0,3)}>
              <Text style={styles.btntext}>{this.data[0][3]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex:1, flexDirection:'row',
                         maxHeight:50, justifyContent:'space-between' }}>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(1,0)}>
              <Text style={styles.btntext}>{this.data[1][0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(1,1)}>
              <Text style={styles.btntext}>{this.data[1][1]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(1,2)}>
              <Text style={styles.btntext}>{this.data[1][2]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(1,3)}>
              <Text style={styles.btntext}>{this.data[1][3]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex:1, flexDirection:'row',
                         maxHeight:50, justifyContent:'space-between' }}>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(2,0)}>
              <Text style={styles.btntext}>{this.data[2][0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(2,1)}>
              <Text style={styles.btntext}>{this.data[2][1]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(2,2)}>
              <Text style={styles.btntext}>{this.data[2][2]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(2,3)}>
              <Text style={styles.btntext}>{this.data[2][3]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex:1, flexDirection:'row',
                         maxHeight:50, justifyContent:'space-between' }}>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(3,0)}>
              <Text style={styles.btntext}>{this.data[3][0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(3,1)}>
              <Text style={styles.btntext}>{this.data[3][1]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(3,2)}>
              <Text style={styles.btntext}>{this.data[3][2]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.allbuttons, styles.keygamebtn]}
              onPress={() => this.btnpress(3,3)}>
              <Text style={styles.btntext}>{this.data[3][3]}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex:1,
                       flexDirection:'row',
                       maxHeight:50,
                       justifyContent:'space-between' }}>

          <Text style={{fontWeight:'bold'}}>Merkle: </Text>
          <Text>{ '0x' + this.keyhash.substring(0,4) +
                  ' ... ' + this.keyhash.substring(28,32) }</Text>
        </View>

        <View style={{ flex:1 }}></View>
      </View>
    );
  }
}

class BackupRestoreScreen extends React.Component {
  constructor({navigation}) {
    super();
    this.nav = navigation;
    this.restoreTxt = '';
  }

  writeToClipboard = async () => {
    let blk = redToBlack();
    await Clipboard.setString( blk );
  }

  setText = (txt) => {
    this.restoreTxt = txt;
  }

  restoreWallet = () => {
    if (!this.restoreTxt || this.restoreTxt.length == 0) return;

    let red = null;
    try {
      let redtxt = blackToRed( this.restoreTxt );
      red = JSON.parse( redtxt );

      if (red != null && red.wallet != null) {
        global.simpleth = red;
        storeData();
        setTimeout( () => {this.nav.navigate('KeyList')}, 500 );
      }
      else {
        console.log( "has to be a simpleth backup" );
      }
    } catch(e) {
      console.log( "failed to parse: " + e.getMessage() );
    }
  }

  render() {
    return (
      <View style={styles.container}>

        <Text style={[styles.txtlabel,styles.oktext]}>
          {strings[locale].Backup}
        </Text>

        <Text style={styles.btntext}>
          {strings[locale].BackupInstructions}
        </Text>

        <TouchableOpacity
          style={ [ styles.allbuttons,
                    styles.container,
                  { flex:0, backgroundColor:'#e9e9e9', marginTop:10} ]}
          onPress={() => {this.writeToClipboard()}}>
          <Image style={{padding:10}} source={copyicon} />
          <Text style={[styles.btntext, {padding:10}]}>
            {strings[locale].CopyButton}
          </Text>
        </TouchableOpacity>

        <View style={{ padding:20 }}></View>

        <Text style={[styles.txtlabel,styles.warntext]}>
          {strings[locale].RestoreButton}
        </Text>

        <Text style={[styles.btntext,styles.warntext]}>
          {strings[locale].RestoreInstructions}
        </Text>

        <View style={{ padding:10 }}></View>

        <TextInput style={[styles.textinput,
                          {color:'darkred',borderColor:'darkred'}]}
          onChangeText={ (text) => {this.setText(text)} }>
        </TextInput>

        <TouchableOpacity
          style={ [ styles.allbuttons,
                    styles.container,
                    styles.warnbutton,
                  { flex:0, backgroundColor:'#e9e9e9', marginTop:20} ]}
          onPress={() => {this.restoreWallet()}}>
          <Image style={{padding:10}} source={restoreicon} />
          <Text style={[styles.btntext, styles.warntext, {padding:10}]}>
            {strings[locale].RestoreButton}
          </Text>
        </TouchableOpacity>

      </View>
    );
  }
}

class KeyDetailsScreen extends React.Component {
  constructor({route, navigation}) {
    super();
    this.nav = navigation;
    this.keyobj = route.params;

    this.radio_props = [
      {label: 'EC Public Key', value: 0},
      {label: 'Ethereum Addr', value: 1}
    ];

    this.setKeyValueToPubkey();
  }

  setKeyValueToPubkey = () => {
    let pkb = Buffer.from( this.keyobj.privkey, 'hex' );
    let pub = secp256k1.publicKeyCreate( pkb, true );
    this.keyvalue = '0x' + aesjs.utils.hex.fromBytes( pub );
  }

  setKeyValueToAddress = () => {
    let pkb = Buffer.from( this.keyobj.privkey, 'hex' );
    // ethereum removes the leading 04 byte from the pubkey before hashing it
    let pub = Buffer.from( secp256k1.publicKeyCreate(pkb, false).slice(1) );
    let addr = '0x' + ethers.keccak256( pub ).slice( -40 ); // 20 bytes, 40 ch
    this.keyvalue = addr;
  }

  handleRadio = val => {
    if (val == 0) {
      this.setKeyValueToPubkey();
    }
    if (val == 1) {
      this.setKeyValueToAddress();
    }
    this.forceUpdate();
  }

  render() {
    return (
      <View style={styles.container}>

        <Text style={styles.txtlabel}>{strings[locale].KeyDetailsLabel + ' ' +
           this.keyobj.keyname }
        </Text>

        <Text style={styles.txtlabel}>{strings[locale].ShowAs}</Text>

        <RadioForm
          buttonColor={'#006400'}
          selectedButtonColor={'#006400'}
          buttonInnerColor={'#006400'}
          buttonOuterColor={'#006400'}
          radio_props={this.radio_props}
          initial={0}
          onPress={ (value) => { this.handleRadio(value) } }
        />

        <View style={{ padding:10 }}></View>
        <QRCode value={this.keyvalue} color={'darkgreen'} size={250} />
        <View style={{ padding:10 }}></View>

        <Text style={[styles.txtdata,{fontSize:10}]}>{this.keyvalue}</Text>

        <View style={ [styles.container, {flexDirection:'row'} ]}>
          <TouchableOpacity
            style={ [styles.allbuttons,
                    {backgroundColor:'#e9e9e9',marginTop:25} ]}
            onPress={() => this.nav.navigate(
              'ScanQR', {adilos:true, key:this.keyobj} )} >
            <Text style={[styles.btntext, {padding:10}]}>
              {strings[locale].IdentifyButton}
            </Text>
          </TouchableOpacity>

          <View style={ {width:50} } />

          <TouchableOpacity
            style={ [styles.allbuttons, styles.warnbutton,
                    {backgroundColor:'#e9e9e9',marginTop:25} ]}
            onPress={() => this.nav.navigate(
              'ScanQR', {adilos:false, key:this.keyobj} )} >
            <Text style={[styles.btntext, styles.warntext, {padding:10}]}>
              {strings[locale].SignSpendButton}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

class ScanQRScreen extends React.Component {
  constructor({route, navigation}) {
    super();
    this.nav = navigation;
    this.isADILOS = route.params.adilos;
    this.keyobj = route.params.key;
  }

  onQRScanned = (qrval) => {
    this.nav.navigate( 'QRScanned',
      {val:qrval, adilos:this.isADILOS, key:this.keyobj} );
  }

  render() {
    return (
      <CameraKitCameraScreen
        hideControls={true}
        scanBarcode={true}
        onReadCode={(event) => this.onQRScanned(event.nativeEvent.codeStringValue)}
        showFrame={true}
      />
    );
  }
}

class QRScannedScreen extends React.Component {
  constructor({route, navigation}) {
    super();
    this.qrval = route.params.val;
    this.isADILOS = route.params.adilos;
    this.keyobj = route.params.key;
    this.setResponse();
  }

  setResponse = () => {
    let result = '';

    try {
      let pvkey =
        Uint8Array.from(Buffer.from(this.keyobj.privkey,'hex'));

      if (this.isADILOS) {
        this.response = adilos.makeResponse( this.qrval, pvkey );
        if (!this.response) this.response = strings[locale].NotADILOS;
        this.foundAgent = adilos.agentInChallenge( this.qrval );
      }
      else {
        if (this.qrval.startsWith('0x'))
          this.qrval = this.qrval.slice(2);

        let msg = Uint8Array.from( Buffer.from(this.qrval,'hex') );

        if (msg.length == 32) {
          let sigObj = secp256k1.ecdsaSign( msg, pvkey );
          let dersig = secp256k1.signatureExport( sigObj.signature );
          this.response = aesjs.utils.hex.fromBytes( dersig );
        }
        else {
          this.response = strings[locale].BadHashLen + ": " + msg.length;
        }
      }
    } catch( e ) {
        this.response = "Exception: " + e.toString();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={ [ styles.txtlabel,
                      (this.isADILOS) ? styles.oktext : styles.warntext ]
                    } >{strings[locale].ResponseNotice}</Text>

        <View style={{ padding:5 }}></View>

        <Text
          style={ [ styles.txtlabel,
                    (this.isADILOS) ? styles.oktext
                                    : styles.warntext ] } >
          { (this.isADILOS) ? strings[locale].ToChallenger
                            : strings[locale].SignSpendWarn }
        </Text>

        <View style={{ padding:10 }}></View>

        <QRCode
          value={this.response}
          color={(this.isADILOS)?'darkgreen':'darkred'}
          size={300} />

        <View style={{ padding:10 }}></View>

        <Text
          style={ [ styles.txtdata,
                   (this.isADILOS) ? styles.oktext : styles.warntext ]
          }>{this.response}</Text>

        <View style={{ padding:10 }}></View>

        <Text style={ (this.foundAgent) ? styles.txtdata : {display:'none'} }>
          KGAgent Detected
        </Text>
      </View>
    );
  }
}

export default class App extends React.Component {

  constructor() {
    super();
    global.simpleth = { wallet: [] };
  }

  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen}
            options={{ title: '' }} />
          <Stack.Screen name="PINPad" component={PINPadScreen}
            options={{ title: strings[locale].SplashName }} />
          <Stack.Screen name="KeyList" component={KeyListScreen}
            options={{ title: strings[locale].PIN }} />
          <Stack.Screen name="NewKey" component={NewKeyScreen}
            options={{ title: strings[locale].KeyList }} />
          <Stack.Screen name="NewKeyName" component={KeyNameDialog}
            options={{ title: strings[locale].NewKeyButton }} />
          <Stack.Screen name="BackupRestore" component={BackupRestoreScreen}
            options={{ title: strings[locale].KeyList }} />
          <Stack.Screen name="KeyDetails" component={KeyDetailsScreen}
            options={{ title: strings[locale].KeyList }} />
          <Stack.Screen name="ScanQR" component={ScanQRScreen}
            options={{ title: strings[locale].KeyDetails }} />
          <Stack.Screen name="QRScanned" component={QRScannedScreen}
            options={{ title: strings[locale].ScanQR }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

