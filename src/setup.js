const fs = require('fs');
const requestAsync = require('./modules/requestAsync');
const readLine = require('./modules/readline');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');

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
			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			const repository = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			if (await q('remove all db collections? (y/n) > ')) {
				if (await q('(!) Do you really do remove all document on db collections? (y/n) > ')) {
					await repository.remove('applicationAccesses', {});
					console.log('cleaned applicationAccesses collection.');
					await repository.remove('authorizeRequests', {});
					console.log('cleaned authorizeRequests collection.');
					await repository.remove('applications', {});
					console.log('cleaned applications collection.');
					await repository.remove('users', {});
					console.log('cleaned users collection.');
				}
			}

			if (await q('generate an application and its key for authentication host (Frost-Web etc.)? (y/n) > ')) {
				let appName = await readLine('application name[Frost Web]: > ');

				if (appName == '') {
					appName = 'Frost Web';
				}

				const user = await db.users.create('frost', null, 'Frost公式', 'オープンソースSNS Frostです。');
				console.log('user created.');

				const application = db.applications.create(appName, user, user.description, [
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
				console.log('application created.', application);

				const applicationKey = await applicationsService.generateApplicationKey();
				console.log(`applicationKey generated. (key: ${applicationKey})`);

				const applicationAccess = await repository.create('applicationAccesses', {
					applicationId: application._id,
					userId: user._id,
					keyCode: null
				});
				console.log('applicationAccess created.', applicationAccess);

				const accessKey = await applicationAccessesService.generateAccessKey();
				console.log(`accessKey generated. (key: ${accessKey})`);
			}
		}
	}
	catch (err) {
		console.log(`Unprocessed Setup Error: ${err}`);
	}

	console.log('## End Setup Mode');
};
