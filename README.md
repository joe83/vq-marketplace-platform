# VQ Marketplace API

## Overview
VQ Marketplace API is a web services layer of VQ marketplace developed with NodeJS. We use [Express Framework](http://expressjs.com/) for buiding on top of it. The Web Services communicate with a mySQL database.

Some parts of the application have been wrapped as modules and open-sourced. You will find our repos here:

* [nodejs-authentication-microservice ](https://github.com/vq-labs/nodejs-authentication-microservice)

The application communicates with some external services: payments provider, email services etc.
Here is the complete list of the services that are used:

* Mandrill
* Stripe

## Important libraries used
In the whole application, you will see a lot of use of the 'async' library, which helps us mange the flow of the callbacks.

[https://github.com/caolan/async](https://github.com/caolan/async)

Also, for modeling the data and DB drived, we use [Sequelize](http://sequelize.com/).

## System setup

### Ubuntu
Install the required packages with apt-get package manager. If you do not know what it is, read about it here [https://wiki.ubuntuusers.de/apt/apt-get/](https://wiki.ubuntuusers.de/apt/apt-get/).
```
sudo apt-get install git // git version management
sudo apt-get install nodejs // server-side javascript
sudo apt-get install nodejs-legacy // links 'nodejs' command to 'node'
sudo apt-get install npm // npm package manager for nodejs
```

After installing npm package manager for nodejs, install the following npm packages:
```
sudo npm install -g gulp // build automation tool
```

## Instalation
Clone the repository into your local developement envirment.
```
git clone https://github.com/vq-labs/vq-marketplace-api.git // clones the repository from remote
cd vq-marketplace-api // goes to the repository folder
npm install // installs the npm packages from ./package.json
```

## Running

In order to start locally the VQ Web Services, you need to run the command:
```
npm run start:local
```

## Deployment
@todo

## Configuration

***NAME***<br>
Name of the marketplace - Will appear as a sender of the emails.

## API Endpoints
@todo

## Development

### Folder Structure
**app.js**

Entry point of ST Web Services.

**./app/config/**

**./app/routes/**

Declaration of our RESTful API. Here you will find the open paths of the API, like 'GET /task' or 'POST /task'

**./app/models/**

Sequelize models

**./app/controllers**
Controllers combine complex business logic.

**./app/events**

### Branching model
1. Never push to 'master'
2. Never push to 'dev'
3. Developers are only allowed to merge features with dev.
4. Before merging your branch push it first and pull the branch you want to merge to.
4. Git masters are allowed to merge 'dev' with 'master'.
5. Git masters are allowed to deploy.
6. Every commit should contain working code. So before commiting, check your code and test your application!
7. Every push MUST contain working code.
8. If you create new branch, create it from dev.
9. Commit and push frequently. Deliver code quickly by merging with dev.

We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

## Licence
MIT.

## Contributors
[VQ LABS](https://vq-labs.com)

