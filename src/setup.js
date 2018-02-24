const fs = require('fs');
const { promisify } = require('util');
const request = promisify(require('request'));
const readLine = require('./modules/readline');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');

const UsersService = require('./services/UsersService');
const ApplicationsService = require('./services/ApplicationsService');
const ApplicationAccessesService = require('./services/ApplicationAccessesService');

const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost/master/config.json';
const q = async str => (await readLine(str)).toLowerCase().indexOf('y') === 0;

const writeFile = promisify(fs.writeFile);

module.exports = async () => {
	console.log('## Setup Mode');

	try {
		console.log('loading config.json ...');
		// config
		const config = loadConfig();
		if (config == null) {
			if (await q('config.json does not exist. generate now? (y/n) > ')) {
				let configPath;

				if (await q('generate config.json in the parent directory of repository? (y/n) > ')) {
					configPath = `${process.cwd()}/../config.json`;
				}
				else {
					configPath = `${process.cwd()}/config.json`;
				}

				const configJson = (await request(urlConfigFile)).body;
				await writeFile(configPath, configJson);

				console.log('generated. please edit config.json and restart frost-api.');
			}
			return;
		}
		console.log('loaded');

		console.log('connecting database ...');
		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		const repository = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);
		console.log('connected');

		const usersService = new UsersService(repository, config);
		const applicationsService = new ApplicationsService(repository, config);
		const applicationAccessesService = new ApplicationAccessesService(repository, config);

		let isExit = false;
		while(!isExit) {
			console.log('<Commands>');
			console.log('1: remove all db collections');
			console.log('2: generate an application and its key for authentication host (Frost-Web etc.)');
			console.log('3: exit');
			const number = parseInt(await readLine('> '));

			if (number == 1) {
				if (await q('(!) Do you really do remove all documents on db collections? (y/n) > ')) {
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
			else if (number == 2) {
				let appName = await readLine('application name[Frost Web]: > ');

				if (appName == '') {
					appName = 'Frost Web';
				}

				const user = await usersService.create('frost', null, 'Frost公式', 'オープンソースSNS Frostです。');
				console.log('user created.');

				const application = applicationsService.create(appName, user, user.description, [
					'iceAuthHost',
					'application',
					'applicationSpecial',
					'accountRead',
					'accountWrite',
					'accountSpecial',
					'userRead',
					'userWrite',
					'userSpecial',
					'postRead',
					'postWrite',
					'storageRead',
					'storageWrite'
				]);
				console.log('application created.', application);

				const applicationKey = await applicationsService.generateApplicationKey(application);
				console.log(`applicationKey generated. (key: ${applicationKey})`);

				const applicationAccess = await applicationAccessesService.create(application._id, user._id);
				console.log('applicationAccess created.', applicationAccess);

				const accessKey = await applicationAccessesService.generateAccessKey(applicationAccess);
				console.log(`accessKey generated. (key: ${accessKey})`);
			}
			else if (number == 3) {
				isExit = true;
			}
			console.log();
		}
		console.log('disconnecting database ...');
		await repository.disconnect();
		console.log('disconnected');
	}
	catch (err) {
		console.log('Unprocessed Setup Error:', err);
	}

	console.log('## End Setup Mode');
};
