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
npm install node-gyp gulp eslint tslint -g
```
Review .env file and make necessary changes first!
## Installation
Clone the repository into your local developement envirment.

```
git clone https://github.com/vq-labs/vq-marketplace-api.git // clones the repository from remote
cd vq-marketplace-api // goes to the repository folder
npm install // installs the npm packages from ./package.json
npm install node-gyp gulp eslint tslint -g // installs global packages
```
### Common problems
```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```
## Running
Review .env file and make necessary changes first then rename it to .env
We have a rule in .gitignore so that you don't commit this file accidentally as it might contain sensitive information. If you want to commit this anyways, remove .env from .gitignore

In order to start locally the VQ Web Services, you need to run the command:
```
npm start
```

The very first time you run this command, all the data tables in the database will be created. We use Sequelize models for it.
Ensure that you also run the init scripts at the very beginning:
```
node scripts/restore-default-config.js services|rental|products|bitcoinmeetup
// here we can specify what marketplace type we want. We have some default implementations developed: services|partner|swap. Also you can specify which language you'd like to add.
node scripts/restore-default-labels.js services en (or one of 'rental', 'products', 'bitcoinmeetup' for marketplaceType)
node scripts/restore-default-posts.js services (or one of 'rental', 'products', 'bitcoinmeetup')
```

## Deployment
We deploy the application with Elastic Beanstalk.


## Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

## Licence
MIT

## Contributors
[VQ LABS](https://vq-labs.com)

