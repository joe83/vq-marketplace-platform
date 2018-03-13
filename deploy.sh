#!/bin/sh
git pull
npm install
npm run build:nolint
pm2 restart ../ecosystem.config.js --only 'API'