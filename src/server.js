'use strict';

const i = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const DbProvider = require('./helpers/dbProvider');
const Db = require('./helpers/db');
const DirectoryRouter = require('./helpers/directoryRouter');
const checkParams = require('./helpers/middlewares/checkParams');
const checkHeaders = require('./helpers/middlewares/checkHeaders');
const checkPermission = require('./helpers/middlewares/checkPermission');
const apiSend = require('./helpers/middlewares/apiSend');

const questionResult = (ans) => (ans.toLowerCase()).indexOf('y') === 0;

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
			app.disable('x-powered-by');

			const dbProvider = await DbProvider.connectApidbAsync(config);
			const db = new Db(config, dbProvider);

			const directoryRouter = new DirectoryRouter(app, db, config);

			app.use((req, res, next) => {
				// dependency injection
				req.directoryRouter = directoryRouter;
				req.db = db;
				req.config = config;

				// sanitize
				req.body = sanitize(req.body);
				req.params = sanitize(req.params);

				next();
			});

			app.use(bodyParser.json());
			app.use(checkPermission);
			app.use(checkHeaders);
			app.use(checkParams);
			app.use(apiSend);

			// routing
			directoryRouter.addRoutes(require('./routes')());

			// not found
			app.use((req, res) => {
				res.apiSend(new require('./helpers/apiResult')(404, 'not found'));
			});

			app.listen(config.api.port, () => {
				console.log(`listen on port: ${config.api.port}`);
			});
		}
	}
	catch(e) {
		console.log(`Server Error: ${e.stack}`);
		console.log();
	}
};
