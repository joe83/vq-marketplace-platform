#!/bin/sh
git pull
# npm install - this slows it down, if we need new update of packages, we do it normally
npm run build:nolint
pm2 restart ../ecosystem.config.js --only 'API'