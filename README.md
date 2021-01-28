# simpleth

New version of [keymaster](https://github.com/bitsanity/keymaster)

# Features

* [ADILOS](https://github.com/bitsanity/adilos) compatible. Works with any [gatekeeper](https://github.com/bitsanity/gatekeeper) and [kgagent](https://github.com/bitsanity/kgagent)
* Rewritten in [React Native](https://reactnative.dev/) for portability to Android and iOS devices
* All javascript
* User can continue to authenticate by ADILOS challenge/response
* **User can sign a 32-byte message hash value to sign offline Ethereum transactions**
* Notifies user when a kgagent is present (this is desirable, sometimes)
* Upon scanning a 32-byte hash, wanrs user that sharing may spend (again this is desirable sometimes)
* Simplified the key-generation randomization game
* Added a basic backup/restore capability
