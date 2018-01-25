# VQ Marketplace API

## Overview
VQ Marketplace API - a web services for creating Sharing Economy Marketplaces. 

You can use the web services with the official VQ Marketplace Storefront:

* [vq-marketplace-web-app](https://github.com/vq-labs/vq-marketplace-web-app) - ReactJS Marketplace Front-End

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
Review .env file and make necessary changes first!

In order to start locally the VQ Web Services, you need to run the command:
```
npm start
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

### Order settlements and transferring reserved funds to Suppliers

## Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

## Licence
MIT

## Contributors
[VQ LABS](https://vq-labs.com)

