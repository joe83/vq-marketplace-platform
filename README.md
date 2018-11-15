# VQ Marketplace Platform
The VQ Marketplace Platform is used for building and running sharing economy and on-demand marketplaces. It supports multi-tenancy. The supported resources include users, listings, listing requests, orders (transactions), reviews and reporting. The Platform follows RESTful standards of data exchange to allow easy and fast integration with third-party providers.

MySQL is the database of choice for VQ Marketplace Platform. Files, images and similar assets are persisted in AWS S3 buckets.

The platform integrates with Stripe - a global payment provider for fiat currency and Mandrill - a Mailchimp Service for E-Mail sending automation.

VQ Marketplace Platform is a priopiatary technology of [VQ LABS](https://vq-labs.com). You can start your marketplace running on the VQ Marketplace Platform on [vqmarketplace.com](https://vqmarketplace.com).

You can use the web services with the official VQ Marketplace Storefront:

* [vq-marketplace-web-app](https://github.com/vq-labs/vq-marketplace-web-app) - ReactJS Marketplace Front-End

## Sharing economy marketplace model
* [Sharing economy marketplace model](https://medium.com/@adrianbarwicki/sharing-economy-marketplace-model-c6732f3e0644)

### Docker
```bash
# this will display the command that needs to be run in order to authenticate
aws ecr get-login --no-include-email

## run the command that is displayed by get-login and then:
docker pull 481877795925.dkr.ecr.us-east-1.amazonaws.com/vqmarketplaceplatform:latest

# This will start the docker container and the server. The server will listen at port 8080 in the docker container.
# -v /Users/<path>:/<container path> enables to maps the folders for uploaded files
docker run -p 8080:8080 docker run -v /Users/<path>:/<container path> --env-file ./.env -d alphateamhackers/vqmarketplaceplatform
# or if you db is hosted locally:
docker run --network="host" --env-file ./.env -d alphateamhackers/vqmarketplaceplatform

#check if the container started and write down container ID
docker ps 

#check docker logs
docker logs <containerID>
```

## Running
Review .env.example file and make necessary changes first then rename it to .env
We have a rule in .gitignore so that you don't commit this file accidentally as it might contain sensitive information. If you want to commit this anyways, remove .env from .gitignore

```
PORT=8080 //this is the default port set on web-app to make requests to
TENANT_PORT=8081 //this is the default port for multi-tenancy management API
TENANT_ID=test  //this is the TENANT_ID, in other terms the name of the marketplace that you want to setup.
                //can be anything. only accepts slug-style
APP_URL=http://localhost:3000   //this is the URL that is used in the welcome e-mail that 
                                //users click to verify themselves. this should be the location of your web-app
WEB_URL=http://localhost:4100   //you can create tenants through the tenant management API.
                                //the example for this can be found at https://vqmarketplace.com/get-started/ 
                                //this URL is used when sending the e-mail verification link
                                // on marketplace creation form step 1.
SHOW_MEMORY_USAGE=false //this is to show how much memory is used with how many tenant marketplaces are running.
SECRET=test //secret for jwt authentication
VQ_DB_USER=root //your mysql db user
VQ_DB_PASSWORD= //your mysql db password
VQ_DB_HOST=localhost //mysql host
STRIPE_ID=  //stripe id for payments
STRIPE_SECRET=  //stripe secret for payments
AWS_S3_BUCKET=  //this AWS bucket will be the bucket for your uploaded files
AWS_S3_REGION=eu-central-1  //the zone of the bucket
MANDRILL=   //mandrill key to use when sending e-mails
```

By default, all the TENANT_ID in all parts of the app (API, WEB-APP) are test. If you change it please make sure that all your env files on every repository related to this project has the same TENANT_ID

In order to start locally the VQ Web Services, you need to run the command:
```
npm start //this starts the app in DEBUG mode. Check below to attach to the debugger
```

Note that this is for VSCode but you can always use the same port to attach to for other editors.
The complete configuration setting is below. If you have more than one configuration just grab the object inside configurations array and append it to your local configurations array.
```
{
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "attach",
            "name": "Attach to Process",
            "port": 5858,
            "restart": true,
            "protocol": "inspector"
        }
    ]
 }
```

If you need to restart the server everytime you change the code you can run:
```
npm run dev //this runs nodemon which restarts the server on change
```


Ensure that you also run the init scripts after running with npm start in a seperate CLI tab:
First fetch the latest configs, labels and posts of our 4 demo marketplaces:
```
node scripts/download-marketplace-template.js
```
The configuration packages will be saved under "src/example-configs". Then do:

```
CONFIG:     This is the backbone of the app. It has varying configurations saved to the database.
            You can find example configurations in
            ./src/example-configs/[services|rental|products|bitcoinmeetup]/config.json
LABELS:     these are the translation of the app and the marketplace.
            You can find example labels in
            ./src/example-configs/i18n/[lang].json
POSTS:      these are the notifications, email and custom page templates stored as HTML.
            You can find example labels in
            ./src/example-configs/i18n/[services|rental|products|bitcoinmeetup]/posts.json

USECASES:   services|rental|products|bitcoinmeetup

TENANTID:   will be the name of the database. If not specified as an argument,
            TENANT_ID specified in .env file will be taken into account.

LANG:       will be the two letter code according to ISO 639-1 Codes.
            By default we have only the English language labels so please use 'en'

The very first time you run any of these commands all the necessary components
like configs, labels, posts and all other required tables will be created.
If you later want to restore any of these components individually,
you can use the commands below which will forcefully update
the existing components you have by the example-configs.

node scripts/restore-default-config.js USECASE TENANTID(optional, see note on TENANTID)
node scripts/restore-default-labels.js USECASE LANG TENANTID(optional, see note on TENANTID)
node scripts/restore-default-posts.js USECASE TENANTID(optional, see note on TENANTID)
```

## System setup (advanced)
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

## Manual installation
Clone the repository into your local developement envirment.

```
git clone https://github.com/vq-labs/vq-marketplace-platform.git // clones the repository from remote
cd vq-marketplace-platform // goes to the repository folder
npm install // installs the npm packages from ./package.json
npm install node-gyp -g // installs global packages
```

## Create new marketplace (tenant)
Create new tenant:
```bash
# node ./scripts/create-marketplace.js <marketplaceType> <marketplaceName> <languageCode>
# Example (service marketplace):
node ./scripts/create-marketplace.js services newAmazingTaskrabbit en
# or (blank marketplace):
node ./scripts/create-marketplace.js blank vqbackend en
```

Start it:
```bash
# TENANT_ID=<marketplaceName> npm run start
# Example:
TENANT_ID=newAmazingTaskrabbit npm run start
```

### Common problems
You might be running an outdated version of node which used to run on command nodejs.
To link the new command 'node' to 'nodejs' you need to run the below command.

```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```


# Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)


# Licence
MIT

# Contributors
[VQ LABS](https://vq-labs.com)

