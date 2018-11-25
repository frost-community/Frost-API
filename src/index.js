const argv = require('argv');
const setup = require('./setup');
const httpServer = require('./http/server');
const streamingServer = require('./streaming/server');
const AsyncLock = require('async-lock');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');
const getVersion = require('./modules/getVersion');
const checkDataFormat = require('./modules/checkDataFormat');

const meta = {
	dataFormatVersion: 1
};

async function entryPoint() {
	argv.option({
		name: 'setup',
		short: 's',
		type: 'boolean',
		description: 'Display setup mode'
	});

	const { options } = argv.run();

	process.on('unhandledRejection', err => console.log(err));
	Error.stackTraceLimit = 20;

	console.log('+------------------+');
	console.log('| Frost API Server |');
	console.log('+------------------+');
	const { version } = getVersion();
	console.log(`version: ${version}`);

	if (options.setup) {
		setup(meta);
	}
	else {
		console.log('loading config ...');
		let config = loadConfig();
		if (config == null) {
			console.log('config file not found. please create by command. (command: npm run generate-configs)');
			return;
		}

		const lock = new AsyncLock();

		const dbConfig = config.database;
		console.log('connecting database ...');
		const repository = await MongoAdapter.connect(
			dbConfig.host,
			dbConfig.database,
			dbConfig.username,
			dbConfig.password);

		console.log('checking dataFormat ...');
		const dataFormatState = await checkDataFormat(repository, meta.dataFormatVersion);
		if (dataFormatState != 0) {
			if (dataFormatState == 1) {
				console.log('please initialize in setup mode. (command: npm run setup)');
			}
			else if (dataFormatState == 2) {
				console.log('migration is required. please migrate database in setup mode. (command: npm run setup)');
			}
			else {
				console.log('this format is not supported. there is a possibility it was used by a newer api. please clear database and restart.');
			}
			repository.disconnect();
			return;
		}

		const {
			http,
			directoryRouter
		} = await httpServer(lock, repository, config);

		streamingServer(http, directoryRouter, repository, config);
	}
}

entryPoint().catch(err => console.error(err));
