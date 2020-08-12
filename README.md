# simpleth

This is a new [keymaster](https://github.com/bitsanity/keymaster) plus support for offline transaction generation.

# Features

* Fully [ADILOS](https://github.com/bitsanity/adilos) compatible with [gatekeeper](https://github.com/bitsanity/gatekeeper) and [kgagent](https://github.com/bitsanity/kgagent)
* Redone as webapp with [Apache Cordova](https://cordova.apache.org/), for cross-platform compatibility (Android, iOS)
* All script - no native C library
* Being a keymaster, user can login by ADILOS challenge/response
* **User can sign a 32-byte message hash value to sign offline Ethereum transactions**
* On scanning an ADILOS challenge, advises whether a kgagent is present (desirable, sometimes)
* On scanning a 32-byte hash, advises one may be about to spend crypto (desirable, sometimes)
