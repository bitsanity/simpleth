# simpleth

A new version of [keymaster](https://github.com/bitsanity/keymaster) with added
support for signing offline transactions.

# Features

* Fully [ADILOS](https://github.com/bitsanity/adilos) compatible with [gatekeeper](https://github.com/bitsanity/gatekeeper) and [kgagent](https://github.com/bitsanity/kgagent)
* Rewritten in javascript and React Native [React Native](https://reactnative.dev/) for cross-platform compatibility (Android, iOS)
* App and all dependencies are 100% open source

# Use Cases

* Login, identify, or open a lock by returning an ADILOS response to a challenge
* Advise if a kgagent is party
* Create an ADILOS challenge and scan someone else's response
* Show key as Public Key
* Show key as Ethereum Address
* Sign a 32-byte message hash and return to form an offline Ethereum transaction that can be submitted on your behalf
* Warn the user when signing a message hash that the signature could be used to spend (your) value

