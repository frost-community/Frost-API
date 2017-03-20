'use strict';

const fs = require('fs');
const requestAsync = require('async-request');
const i = require('./helpers/readline');
const loadConfig = require('./helpers/loadConfig');
const DbProvider = require('./helpers/dbProvider');
const Db = require('./helpers/db');

const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost-API/develop/config.json';
const questionResult = (ans) => (ans.toLowerCase()).indexOf('y') === 0;

module.exports = async () => {
	console.log();
	console.log('-- Setup Mode --');
	console.log();

	try {
		if (loadConfig() == null) {
			if (questionResult(await i('config file is not found. generate now? (y/n) > '))) {
				let configPath;

				if (questionResult(await i('generate config.json in the parent directory of repository? (y/n) > ')))
					configPath = `${process.cwd()}/../config.json`;
				else
					configPath = `${process.cwd()}/config.json`;

				const configJson = (await requestAsync(urlConfigFile)).body;
				fs.writeFileSync(configPath, configJson);
			}
		}

		let config = loadConfig();

		if (config != null) {
			if (questionResult(await i('generate an application and its key for authentication host (Frost-Web etc.)? (y/n) > '))) {
				let appName = await i('application name[Frost Web]: > ');

				if (appName == '')
					appName = 'Frost Web';

				const dbProvider = await DbProvider.connectApidbAsync(config);
				const db = new Db(config, dbProvider);

				const user = await db.users.createAsync({
					screenName: 'frost',
					passwordHash: null,
					name: 'Frost公式',
					description: 'オープンソースSNS Frostです。'
				});
				console.log('user created.');

				const application = await db.applications.createAsync({
					name: appName,
					creatorId: user.document._id,
					description: user.document.description,
					permissions: [
						'iceAuthHost',
						'application',
						'applicationSpecial',
						'accountRead',
						'accountWrite',
						'accountSpecial',
						'userRead',
						'userWrite',
						'postRead',
						'postWrite'
					]
				});
				console.log(`application created. ${application.document}`);

				const applicationKey = await application.generateApplicationKeyAsync();
				console.log(`applicationKey generated. (key: ${applicationKey})`);

				const applicationAccess = await db.applicationAccesses.createAsync({
					applicationId: application.document._id,
					userId: user.document._id,
					keyCode: null
				});
				console.log(`applicationAccess created. ${applicationAccess.document}`);

				const accessKey = await applicationAccess.generateAccessKeyAsync();
				console.log(`accessKey generated. (key: ${accessKey})`);
			}
		}
	}
	catch(e) {
		console.log(`Setup Error: ${e}`);
	}

	console.log('----------------');
};
