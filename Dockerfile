FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "npm", "run" , "build:nolint" ]
CMD [ "npm", "start" ]