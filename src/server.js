const readLine = require('./helpers/readline');
const express = require('express');
const httpClass = require('http');
const bodyParser = require('body-parser');
const compression = require('compression');
const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const DbProvider = require('./helpers/dbProvider');
const Db = require('./helpers/db');
const Route = require('./helpers/route');
const DirectoryRouter = require('./helpers/directoryRouter');
const apiSend = require('./helpers/middlewares/apiSend');
const AsyncLock = require('async-lock');
const ApiContext = require('./helpers/ApiContext');
const routeList = require('./routeList');
const setup = require('./setup');

const q = async str => (await readLine(str)).toLowerCase().indexOf('y') === 0;

module.exports = async () => {
	try {
		console.log('+------------------+');
		console.log('| Frost API Server |');
		console.log('+------------------+');

		let config = loadConfig();
		if (config == null) {
			if (await q('config file is not found. display setting mode now? (y/n) ')) {
				await setup();
				config = loadConfig();
			}

			if (config == null) {
				return;
			}
		}

		const app = express();
		const http = httpClass.Server(app);
		app.disable('x-powered-by');
		app.set('etag', 'weak');

		const directoryRouter = new DirectoryRouter(app);
		const streams = new Map(); // memo: keyはChannelName
		const db = new Db(config, await DbProvider.connectApidbAsync(config));

		app.use(compression({
			threshold: 0,
			level: 9,
			memLevel: 9
		}));

		app.use(bodyParser.json());

		app.use(apiSend);

		app.use((req, res, next) => {
			// services
			req.config = config;
			req.streams = streams;
			req.db = db;
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
			const apiContext = new ApiContext(req.streams, req.lock, req.db, req.config);
			apiContext.response(404, 'endpoint not found');
			res.apiSend(apiContext);
		});

		http.listen(config.api.port, () => {
			console.log(`listen on port: ${config.api.port}`);
		});

		require('./streaming-server')(http, directoryRouter, streams, db, config);
	}
	catch (err) {
		console.log('Unprocessed Server Error:', err);
	}
};
