const randomstring = require("randomstring");
const path = require("path");
const args = require('yargs').argv;
const appRoot = require('app-root-path').path;
const fs = require('fs');

const generateConfig = () => {
  if (!args.config) {
    console.log("ERROR: Please provide a config file as an argument!")
  }

  if (!args.env) {
    console.log("ERROR: Please provide an environment as an argument!")
  }

  if(!fs.existsSync(path.join(appRoot, args.config))) {
    console.log("Config file was not found at ", path.join(appRoot, args.config));
    return null;
  } else {
   return fs.readFileSync(path.join(appRoot, args.config), "utf8");
  }
}

if (!generateConfig()) {
  return;
}

const config = JSON.parse(generateConfig());
config.env = args.env.toUpperCase();


// this will work only with one instance, but we use always 1 instance for testing
if (!config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["SECRET"]) {
	config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["SECRET"] = randomstring.generate(64);
}

module.exports = () => config;
