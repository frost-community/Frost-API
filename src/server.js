'use strict';

const i = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const Db = require('./helpers/db');
const DirectoryRouter = require('./helpers/directoryRouter');
const checkParams = require('./helpers/middlewares/checkParams');
const checkHeaders = require('./helpers/middlewares/checkHeaders');
const checkPermission = require('./helpers/middlewares/checkPermission');

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
			app.use(bodyParser.json());

			const db = new Db(config);
			await db.connectAsync();

			const directoryRouter = new DirectoryRouter(app, db, config);

			app.use((req, res, next) => {
				req.directoryRouter = directoryRouter;
				req.db = db;
				req.config = config;
				next();
			});

			app.use((req, res, next) => {
				req.body = sanitize(req.body);
				req.params = sanitize(req.params);
				next();
			});

			directoryRouter.addRoutes(require('./routes')(), [checkPermission, checkHeaders, checkParams]);

			app.use((req, res) => {
				require('./helpers/responseHelper')(res);
				res.error(new require('./helpers/apiResult')(404, 'not found'));
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
