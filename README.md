# VQ Marketplace Platform
The VQ Marketplace Platform is used for running Sharing Economy and On-Demand Marketplace Back-Ends. It supports multi-tenancy and multi-applications. The supported resources include users, listings, listing requests, orders (transactions), reviews and reporting. The Platform follows RESTful standards of data exchange to allow easy and fast integration with third-party providers.

MySQL is the database of choice for VQ Marketplace Platform. Files, images and similar assets are persisted in AWS S3 buckets.

The platform integrates with Stripe - a global payment provider for fiat currency and Mandrill - a Mailchimp Service for E-Mail sending automation.

VQ Marketplace Platform is a priopiatary technology of [VQ LABS](https://vq-labs.com). You can start your marketplace running the VQ Marketplace Platform on [vqmarketplace.com](https://vqmarketplace.com).

You can use the web services with the official VQ Marketplace Storefront:

* [vq-marketplace-web-app](https://github.com/vq-labs/vq-marketplace-web-app) - ReactJS Marketplace Front-End

## Marketplace templates
You can view the live demos here:
* [Product Marketplace - Copy of Tindie](https://b2btemplate.vqmarketplace.com)
* [Rental Marketplace - Copy of AirBnB](https://rental-kitchen.vqmarketplace.com)
* [Product Marketplace - Copy of Airtasker](https://vqtemplate-airtasker.vqmarketplace.com)
* [Exchange Marketplace - Cryptocurrency OTC Exchange](https://bitcoinmeetup.vqmarketplace.com)

## System setup

### Ubuntu
Install the required packages with apt-get package manager. If you do not know what it is, read about it here [https://wiki.ubuntuusers.de/apt/apt-get/](https://wiki.ubuntuusers.de/apt/apt-get/).
```
sudo apt-get install git // git version management
sudo apt-get install nodejs // server-side javascript
sudo apt-get install nodejs-legacy // links 'nodejs' command to 'node'
sudo apt-get install npm // npm package manager for nodejs
sudo apt-get install build-essential
npm install -g node-gyp
```

After installing npm package manager for nodejs, install the following npm packages:
```
sudo npm install -g gulp // build automation tool
```

## Installation
Clone the repository into your local developement envirment.


```
git clone https://github.com/vq-labs/vq-marketplace-api.git // clones the repository from remote
cd vq-marketplace-api // goes to the repository folder
npm install // installs the npm packages from ./package.json
```
### Common problems
```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```


## Running
In order to start locally the VQ Web Services, you need to run the command:
```
npm run start:local
```

The very first time you run this command, all the data tables in the database will be created. We use Sequelize models for it.
Ensure that you also run the init scripts at the very beginning:
```
node scripts/restore-default-config.js services|rental
// here we can specify what marketplace type we want. We have some default implementations developed: services|partner|swap. Also you can specify which language you'd like to add.
node scripts/restore-default-labels.js services en (or rental for marketplaceType)
node scripts/restore-default-posts.js services (or rental)
```

## Deployment
We deploy the application with Elastic Beanstalk.

## Configuration

***NAME***<br>
Name of the marketplace

## API

### Creating User Accounts
#### Supply side
#### Demand side

### Creating Supply Listings

### Creating Demand Listings

### Creating Requests for Listings

### Creating an order / booking
*** POST /api/order ***
Orders can only be created for requests by users of type "Demand".
There can be only one order per request.

### Order settlements and transferring reservered funds to Suppliers

## Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

## Licence
MIT

## Contributors
[VQ LABS](https://vq-labs.com)

