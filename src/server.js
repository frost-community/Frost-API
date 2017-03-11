'use strict';

const fs = require('fs');
const ioif = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const routes = require('./routes');
const loadConfig = require('./helpers/loadConfig');
const requestAsync = require('async-request');
const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost-API/develop/config.json';

module.exports = () => {
	(async () => {
		console.log('--------------------');
		console.log('  Frost API Server  ');
		console.log('--------------------');

		// dialog: generate config file

		let config = loadConfig();

		if (config == null) {
			let ans = (await ioif.questionAsync('config file is not found. generate now? (y/n) ')).toLowerCase();
			if (ans == 'y' || ans == 'yes') {
				ans = (await ioif.questionAsync('generate config.json in the parent directory of repository? (y/n) ')).toLowerCase();

				config = JSON.parse((await requestAsync(urlConfigFile)).body);

				let configPath;
				if (ans == 'y' || ans == 'yes')
					configPath = `${process.cwd()}/../config.json`;
				else
					configPath = `${process.cwd()}/config.json`;

				fs.writeFileSync(configPath, JSON.stringify(config, null, '  '));
			}
			else {
				process.exit();
			}
		}

		const app = express();
		app.disable('x-powered-by');
		app.use(bodyParser.json());
		const router = require('./helpers/router')(app, config);

		const checkParams = require('./helpers/middlewares/checkParams')(router).execute;
		const checkPermission = require('./helpers/middlewares/checkPermission')(router).execute;

		router.addRoutes(routes(), [checkPermission, checkParams]);

		app.use((req, res, next) => {
			require('./helpers/responseHelper')(res);
			res.error(require('./helpers/apiResult')(404, 'not found'));
		});

		app.listen(config.api.port, () => {
			console.log(`listen on port: ${config.api.port}`);
		});
	})();
};
