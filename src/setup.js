const fs = require('fs');
const requestAsync = require('./helpers/requestAsync');
const readLine = require('./helpers/readline');
const loadConfig = require('./helpers/loadConfig');
const DbProvider = require('./helpers/dbProvider');
const Db = require('./helpers/db');

const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost/master/config.json';
const q = async str => (await readLine(str)).toLowerCase().indexOf('y') === 0;

const writeFile = (filePath, data) => new Promise((resolve, reject) => {
	fs.writeFile(filePath, data, err => {
		if (err) reject(err);
		resolve();
	});
});

module.exports = async () => {
	console.log();
	console.log('## Setup Mode');
	console.log();

	try {
		if (loadConfig() == null) {
			if (await q('config file is not found. generate now? (y/n) > ')) {
				let configPath;

				if (await q('generate config.json in the parent directory of repository? (y/n) > ')) {
					configPath = `${process.cwd()}/../config.json`;
				}
				else {
					configPath = `${process.cwd()}/config.json`;
				}

				const configJson = (await requestAsync(urlConfigFile)).body;
				await writeFile(configPath, configJson);
			}
		}

		let config = loadConfig();

		if (config != null) {
			const dbProvider = await DbProvider.connectApidbAsync(config);
			const db = new Db(config, dbProvider);

			if (await q('remove all db collections? (y/n) > ')) {
				if (await q('(!) Do you really do remove all document on db collections? (y/n) > ')) {
					await db.applicationAccesses.removeAsync({});
					console.log('cleaned applicationAccesses collection.');
					await db.authorizeRequests.removeAsync({});
					console.log('cleaned authorizeRequests collection.');
					await db.applications.removeAsync({});
					console.log('cleaned applications collection.');
					await db.users.removeAsync({});
					console.log('cleaned users collection.');
				}
			}

			if (await q('generate an application and its key for authentication host (Frost-Web etc.)? (y/n) > ')) {
				let appName = await readLine('application name[Frost Web]: > ');

				if (appName == '') {
					appName = 'Frost Web';
				}

				const user = await db.users.createAsync('frost', null, 'Frost公式', 'オープンソースSNS Frostです。');
				console.log('user created.');

				const application = db.applications.createAsync(appName, user, user.document.description, [
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
				]);
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
	catch (err) {
		console.log(`Unprocessed Setup Error: ${err}`);
	}

	console.log('## End Setup Mode');
};
