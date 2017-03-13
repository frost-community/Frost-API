'use strict';

const fs = require('fs');
const stdi = require('./helpers/readline');
const bodyParser = require('body-parser');
const express = require('express');
const loadConfig = require('./helpers/loadConfig');
const requestAsync = require('async-request');
const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost-API/develop/config.json';
const sanitize = require('mongo-sanitize');

module.exports = () => {
	(async () => {
		try {
			console.log('--------------------');
			console.log('  Frost API Server  ');
			console.log('--------------------');

			// dialog: generate config file

			let config = loadConfig();

			if (config == null) {
				let ans = (await stdi.questionAsync('config file is not found. generate now? (y/n) ')).toLowerCase();
				if (ans == 'y' || ans == 'yes') {
					ans = (await stdi.questionAsync('generate config.json in the parent directory of repository? (y/n) ')).toLowerCase();

					let configPath;
					if (ans == 'y' || ans == 'yes')
						configPath = `${process.cwd()}/../config.json`;
					else
						configPath = `${process.cwd()}/config.json`;

					const configJson = (await requestAsync(urlConfigFile)).body;
					fs.writeFileSync(configPath, configJson);
					config = JSON.parse(configJson);
				}
			}

			if (config != null) {
				const app = express();
				app.disable('x-powered-by');
				app.use(bodyParser.json());
				const router = require('./helpers/router')(app, config);

				app.use((req, res, next) => {
					req.body = sanitize(req.body);
					req.params = sanitize(req.params);
					next();
				});

				const checkParams = (await require('./helpers/middlewares/checkParams')(config, router)).execute;
				const checkPermission = (await require('./helpers/middlewares/checkPermission')(config, router)).execute;

				router.addRoutes(require('./routes')(), [checkPermission, checkParams]);

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
	})();
};
