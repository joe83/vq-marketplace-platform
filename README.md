# VQ Marketplace Platform
The VQ Marketplace Platform is used for building and running sharing economy and on-demand marketplaces. It supports multi-tenancy. The supported resources include users, listings, listing requests, orders (transactions), reviews and reporting. The Platform follows RESTful standards of data exchange to allow easy and fast integration with third-party providers.

MySQL is the database of choice for VQ Marketplace Platform. Files, images and similar assets are persisted in AWS S3 buckets.

The platform integrates with Stripe - a global payment provider for fiat currency and Mandrill - a Mailchimp Service for E-Mail sending automation.

VQ Marketplace Platform is a priopiatary technology of [VQ LABS](https://vq-labs.com). You can start your marketplace running on the VQ Marketplace Platform on [vqmarketplace.com](https://vqmarketplace.com).

You can use the web services with the official VQ Marketplace Storefront:

* [vq-marketplace-web-app](https://github.com/vq-labs/vq-marketplace-web-app) - ReactJS Marketplace Front-End

## Sharing economy marketplace model
* [Sharing economy marketplace model](https://medium.com/@adrianbarwicki/sharing-economy-marketplace-model-c6732f3e0644)

## Marketplace templates
You can view the live demos here:
* [Product Marketplace - Copy of Tindie](https://b2btemplate.vqmarketplace.com)
* [Rental Marketplace - Copy of AirBnB](https://rental-kitchen.vqmarketplace.com)
* [Product Marketplace - Copy of Airtasker](https://vqtemplate-airtasker.vqmarketplace.com)
* [Exchange Marketplace - Cryptocurrency OTC Exchange](https://bitcoinmeetup.vqmarketplace.com)

In order to download current configuration templates run:
```
node scripts/download-marketplace-template.js
```
The configuration packages will be saved under "src/example-configs".

## System setup

### Ubuntu
Install the required packages with apt-get package manager. If you do not know what it is, read about it here [https://wiki.ubuntuusers.de/apt/apt-get/](https://wiki.ubuntuusers.de/apt/apt-get/).
```
sudo apt-get install git // git version management
sudo apt-get install nodejs // server-side javascript
sudo apt-get install nodejs-legacy // links 'nodejs' command to 'node'
sudo apt-get install npm // npm package manager for nodejs
sudo apt-get install build-essential
npm install node-gyp -g
```

## Installation
Clone the repository into your local developement envirment.

```
git clone https://github.com/vq-labs/vq-marketplace-api.git // clones the repository from remote
cd vq-marketplace-api // goes to the repository folder
npm install // installs the npm packages from ./package.json
npm install node-gyp -g // installs global packages
```
### Common problems
```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```
## Running
Review .env.example file and make necessary changes first then rename it to .env
We have a rule in .gitignore so that you don't commit this file accidentally as it might contain sensitive information. If you want to commit this anyways, remove .env from .gitignore

By default, all the TENANT_ID in all parts of the app (API, WEB-APP) are test. If you change it please make sure that all your env files has the same TENANT_ID

In order to start locally the VQ Web Services, you need to run the command:
```
npm start
```

Ensure that you also run the init scripts after running with npm start in a seperate CLI tab:
```
Please keep reading:

CONFIG: this is the backbone of the app. It has varying configurations saved to the database. You can find example configurations in ./src/example-configs/[services|rental|products|bitcoinmeetup]/config.json
LABELS: these are the translation of the app and the marketplace. You can find example labels in ./src/example-configs/i18n/[lang].json
POSTS: these are the notification, email and custom page templates stored as HTML. You can find example labels in ./src/example-configs/i18n/[services|rental|products|bitcoinmeetup]/posts.json

USECASES:
services|rental|products|bitcoinmeetup
TENANTID: will be the name of the database. If not specified as an argument, .env TENANT_ID will be taken into account.
LANG: will be the two letter code according to ISO 639-1 Codes. By default we have only the English language labels so please use 'en'

The very first time you run any of these commands all the necessary components (configs, labels, posts and all other required tables) will be created. If you later want to restore any of these components individually, you can use the commands below which will forcefully update the existing components you have by the example-configs.

node scripts/restore-default-config.js USECASE TENANTID(optional, see note on TENANTID)
node scripts/restore-default-labels.js USECASE LANG TENANTID(optional, see note on TENANTID)
node scripts/restore-default-posts.js USECASE TENANTID(optional, see note on TENANTID)
```

## Deployment
We deploy the application with Elastic Beanstalk.

# Environments

We have tested the application in these environments but a .nvmrc and package.json engines have been setup for you to take a hint on:
(If you use NVM, you can do nvm use which will take .nvmrc file into account)
(If you want to install Node and NPM manually you can check the engines in package.json)

NodeJS 7.2.1 and NPM 3.10.9 on macOS Sierra 10.12.6,
NodeJS 8.3.0 and NPM 5.6 on Windows 10,
NodeJS 9.0.0 and NPM 5.5.1 on AWS Linux Ubuntu 16.04.2


## Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

## Licence
MIT

## Contributors
[VQ LABS](https://vq-labs.com)

