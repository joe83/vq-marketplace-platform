const cors = require("cors");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require("./app/config/configProvider.js")();
const app = require('express')();
const models = require('./app/models/models');

app.set('view engine', 'ejs');
app.set('json spaces', 2);
app.set('superSecret', config.secret);
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
	req.auth = {
		token: req.headers['x-auth-token']
	};
	
	next();
});

require('./app/routes.js')(app);
require('./app/workers/index.js').registerWorkers();

logAppInfo();

var server;

models.seq.sync().then(() => {
	server = app.listen(config.port, () => {
		var host = server.address().address;
		var port = server.address().port;

		console.log(`VQ-Marketplace API listening at port ${port}`);
		console.log("API config:", config);

		setInterval(() => {
			const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

			console.log(`[VQ-MARKETPLACE-API] The process is consuming now approximately ${Math.round(usedMemory * 100) / 100} MB memory.`);
		}, 5000);
	});
});

module.exports.closeServer = closeServer;
    
function logAppInfo () {
	if (config.production === true) {
		console.log("-------------------------------------------------");
		console.log("[PRODUCTION MODE] THIS API RUNS IN PRODUCTION MODE..");
		console.log("-------------------------------------------------");
	}
}

function initRoutes (app) {
	require('./app/routes.js')(app);
}

function closeServer () {
  server.close();
}
