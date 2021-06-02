# Agrista SDK

## Install

1. Clone the repository `git clone https://github.com/agrista/angular-sdk.git`
2. Move into the sdk directory `cd angular-sk`

### Node Dependencies

1. Install node.js global  dependencies `sudo npm install -g bower grunt`
2. Install node.js developer dependencies `npm install`

### Bower Dependencies

1. Install bower dependencies `bower install`

## Develop

1. Fetch the remote branches `git fetch origin`
2. Checkout the develop branch `git checkout -b develop origin/develop`
3. Pull the latest version `git pull origin develop`

## Build

1. To build new compressed and minimised dist files run `grunt`
2. Update the bower.json version parameter, commit your changes, then tag the commit with the same version