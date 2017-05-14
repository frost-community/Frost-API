'use strict';

const i = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const httpClass = require('http');

const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const DbProvider = require('./helpers/dbProvider');
const Db = require('./helpers/db');
const Route = require('./helpers/route');
const DirectoryRouter = require('./helpers/directoryRouter');
const apiSend = require('./helpers/middlewares/apiSend');
const checkRequest = require('./helpers/middlewares/checkRequest');

const questionResult = (ans) => (ans.toLowerCase()).indexOf('y') === 0;
Error.stackTraceLimit = 20;

process.on('unhandledRejection', console.dir);

module.exports = async () => {
	try {
		console.log('--------------------');
		console.log('  Frost API Server  ');
		console.log('--------------------');

		let config = loadConfig();
		if (config == null) {
			if (questionResult(await i('config file is not found. display setting mode now? (y/n) '))) {
				await require('./setup')();
				config = loadConfig();
			}
		}

		if (config != null) {
			const app = express();
			const http = httpClass.Server(app);
			app.disable('x-powered-by');
			const dbProvider = await DbProvider.connectApidbAsync(config);
			const db = new Db(config, dbProvider);
			const directoryRouter = new DirectoryRouter(app);
			const subscribers = new Map();

			app.use((req, res, next) => {
				// services
				// req.directoryRouter = directoryRouter;
				req.db = db;
				req.config = config;

				// sanitize
				req.body = sanitize(req.body);
				req.params = sanitize(req.params);

				// cors headers
				res.header('Access-Control-Allow-Origin', '*');
				res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

				next();
			});

			app.use(bodyParser.json());
			app.use(apiSend);
			app.use(checkRequest);

			app.use((req, res, next) => {
				req.subscribers = subscribers;

				next();
			});

			// add routes
			for(const route of require('./routeList')()) {
				let method = route[0];
				const path = route[1];

				if (method == 'del')
					method = 'delete';

				directoryRouter.addRoute(new Route(method, path));
			}

			// not found
			app.use((req, res) => {
				res.apiSend(new (require('./helpers/apiResult'))(404, 'not found'));
			});

			http.listen(config.api.port, () => {
				console.log(`listen on port: ${config.api.port}`);
			});

			require('./streaming-server')(http, subscribers, db, config);
		}
	}
	catch(err) {
		console.log(`Unprocessed Server Error: ${err.stack}`);
	}
};
