const express = require('express');
const httpClass = require('http');
const bodyParser = require('body-parser');
const compression = require('compression');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const sanitize = require('mongo-sanitize');
const MongoAdapter = require('./modules/MongoAdapter');
const Route = require('./modules/route');
const DirectoryRouter = require('./modules/directoryRouter');
const apiSend = require('./modules/middlewares/apiSend');
const AsyncLock = require('async-lock');
const ApiContext = require('./modules/ApiContext');
const routeList = require('./routeList');

module.exports = async () => {
	try {
		console.log('+------------------+');
		console.log('| Frost API Server |');
		console.log('+------------------+');

		let config = loadConfig();
		if (config == null) {
			console.log('config file not found. please create in setup mode. (command: npm run setup)');
			return;
		}

		const app = express();
		const http = httpClass.Server(app);
		app.disable('x-powered-by');
		app.set('etag', 'weak');

		const directoryRouter = new DirectoryRouter(app);
		const streams = new Map(); // memo: keyはChannelName

		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		const repository = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

		app.use(compression({
			threshold: 0,
			level: 9,
			memLevel: 9
		}));

		app.use(apiSend);

		app.use(bodyParser.json({ limit: '1mb' }));

		app.use((req, res, next) => {
			// services
			req.config = config;
			req.streams = streams;
			req.repository = repository;
			req.lock = new AsyncLock();

			// sanitize
			req.body = sanitize(req.body);
			req.params = sanitize(req.params);

			// cors headers
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

			next();
		});

		// add all routes
		for (const route of routeList) {
			directoryRouter.addRoute(new Route(route[0], route[1]));
		}

		// not found
		app.use((req, res) => {
			const apiContext = new ApiContext(null, null, repository, config);
			apiContext.response(404, 'endpoint not found, or method is not supported');
			res.apiSend(apiContext);
		});

		app.use((err, req, res, next) => {
			const apiContext = new ApiContext(null, null, repository, config);
			if (err instanceof SyntaxError && err.message.indexOf('JSON')) {
				apiContext.response(400, 'invalid json format');
			}
			else {
				apiContext.response(500, 'internal error');
			}
			res.apiSend(apiContext);
		});

		http.listen(config.api.port, () => {
			console.log(`listen on port: ${config.api.port}`);
		});

		require('./streaming-server')(http, directoryRouter, streams, repository, config);
	}
	catch (err) {
		console.log('Unprocessed Server Error:', err);
	}
};
