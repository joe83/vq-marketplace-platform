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
docker run -p 8080:8080 -v /Users/<path>:/<container path> --env-file ./.env -d alphateamhackers/vqmarketplaceplatform
# or if you db is hosted locally:
docker run --network="host" -v /Users/<path>:/<container path> --env-file ./.env -d alphateamhackers/vqmarketplaceplatform

#check if the container started and write down container ID
docker ps 

#check docker logs
docker logs <containerID>
```

## Running
Review .env.example file and make necessary changes first then rename it to .env


```ENV=production
PORT=8080
TENANT_PORT=8081
TENANT_ID=test

VQ_DB_USER=root
VQ_DB_PASSWORD=
VQ_DB_HOST=localhost

FILE_UPLOAD=local
FILE_UPLOAD_DIRECTORY=/home/ubuntu/.vq
FILE_UPLOAD_LIMIT=10
SUPERADMIN_ENABLE=1
SUPERADMIN_USERNAME=test
SUPERADMIN_PASSWORD=test

APP_URL=
WEB_URL=
SHOW_MEMORY_USAGE=0
SECRET=test
AWS_S3_BUCKET=
AWS_S3_REGION=eu-central-1
MANDRILL=
CHARGEBEE_SITE=
CHARGEBEE_API_KEY=
CHARGEBEE_TEST_SITE=
CHARGEBEE_TEST_API_KEY=
STRIPE_ID=
STRIPE_SECRET=
STRIPE_TEST_ID=
STRIPE_TEST_SECRET=
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

