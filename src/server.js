'use strict';

const i = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const loadConfig = require('./helpers/loadConfig');
const sanitize = require('mongo-sanitize');
const questionResult = (ans) => (ans.toLowerCase()).indexOf('y') === 0;
const DB = require('./helpers/db').DB;

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

			const router = require('./helpers/router')(app, db, config);

			app.use((req, res, next) => {
				req.body = sanitize(req.body);
				req.params = sanitize(req.params);
				next();
			});

			const checkParams = (await require('./helpers/middlewares/checkParams')(router, db, config)).execute;
			const checkHeaders = (await require('./helpers/middlewares/checkHeaders')(router, db, config)).execute;
			const checkPermission = (await require('./helpers/middlewares/checkPermission')(router, db, config)).execute;

			router.addRoutes(require('./routes')(), [checkPermission, checkHeaders, checkParams]);

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
		console.log(`Server Error: ${e}`);
	}
};
