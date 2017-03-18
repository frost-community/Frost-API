'use strict';

const i = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const DB = require('./helpers/DB');
const DirectoryRouter = require('./helpers/DirectoryRouter');

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

			const db = new DB(config);
			await db.connectAsync();

			const directoryRouter = new DirectoryRouter(app, db, config);

			app.use((req, res, next) => {
				req.body = sanitize(req.body);
				req.params = sanitize(req.params);
				next();
			});

			const checkParams = require('./helpers/middlewares/checkParams')(directoryRouter, db, config).execute;
			const checkHeaders = require('./helpers/middlewares/checkHeaders')(directoryRouter, db, config).execute;
			const checkPermission = require('./helpers/middlewares/checkPermission')(directoryRouter, db, config).execute;

			directoryRouter.addRoutes(require('./routes')(), [checkPermission, checkHeaders, checkParams]);

			app.use((req, res) => {
				require('./helpers/responseHelper')(res);
				res.error(require('./helpers/apiResult')(404, 'not found'));
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
