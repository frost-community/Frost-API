const fs = require('fs');
const { promisify } = require('util');
const request = promisify(require('request'));
const readLine = require('./modules/readline');
const { loadConfig, delay } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');

const UsersService = require('./services/UsersService');
const ApplicationsService = require('./services/ApplicationsService');
const TokensService = require('./services/TokensService');

const urlConfigFile = 'https://raw.githubusercontent.com/Frost-Dev/Frost/master/config.json';
const q = async str => (await readLine(str)).toLowerCase().indexOf('y') === 0;

const writeFile = promisify(fs.writeFile);

const scopes = require('./modules/scopes');

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
		const tokensService = new TokensService(repository, config);

		let isExit = false;
		while(!isExit) {
			console.log('<Commands>');
			console.log('0: exit setup');
			console.log('1: remove all db collections');
			console.log('2: generate an application and its key for authorization host (Frost-Web etc.)');
			console.log('3: migrate from old versions');
			const number = parseInt(await readLine('> '));

			if (number == 0) {
				isExit = true;
			}
			else if (number == 1) {
				if (await q('(!) Do you really do remove all documents on db collections? (y/n) > ')) {
					const clean = async (collection) => {
						await repository.remove(collection, {});
						console.log(`cleaned ${collection} collection.`);
					};
					await clean('users');
					await clean('userFollowings');
					await clean('posts');
					await clean('storageFiles');
					await clean('applications');
					await clean('tokens');
				}
			}
			else if (number == 2) {
				let appName = await readLine('application name(default: Frost Web) > ');

				if (appName == '') {
					appName = 'Frost Web';
				}

				const user = await usersService.create('frost', null, 'Frost公式', 'オープンソースSNS Frostです。');
				console.log('user created.');

				const application = applicationsService.create(appName, user, user.description, scopes.map(s => s.name), { root: true });
				console.log('root application created.');

				//const applicationSecret = await applicationsService.generateApplicationSecret(application);
				//console.log(`applicationSecret generated. (secret: ${applicationSecret})`);

				const hostToken = await tokensService.create(application, user, ['auth.host', 'app.host', 'user.create', 'user.delete']);
				console.log('host token created:', hostToken);
			}
			else if (number == 3) {
				const migrate = async (migrationId) => {
					if (migrationId == '0.2->0.3') {
						console.log('migrating to v0.3 ...');
						const applications = await repository.findArray('applications', {});
						console.log('apps length:', applications.length);

						// root application
						if (applications.length >= 1) {
							await repository.update('applications', { _id: applications[0]._id }, { root: true });
						}

						// application "permissions" -> "scopes"
						for(const app of applications) {
							const scopesConversionTable = {
								iceAuthHost: 'auth.host',
								application: ['app.read', 'app.write'],
								applicationSpecial: 'app.host',
								accountRead: 'user.account.read',
								accountWrite: 'user.account.write',
								accountSpecial: null,
								userRead: 'user.read',
								userWrite: 'user.write',
								userSpecial: ['user.create', 'user.delete'],
								postRead: 'post.read',
								postWrite: 'post.write',
								storageRead: 'storage.read',
								storageWrite: 'storage.write'
							};

							const scopes = [];
							for(let p of app.permissions) {
								let newName = scopesConversionTable[p];
								if (newName == null) {
									console.log(p, '-> remove');
								}
								else if (!Array.isArray(newName)) {
									scopes.push(newName);
								}
								else {
									scopes.push(...newName);
								}
							}
							console.log(app.permissions, '->', scopes);

							// await repository.update('applications', { _id: app._id }, { scopes: [] });
						}

						// await repository.create('meta', { type: 'api.version', major: 0, minor: 3 });
					}
					else {
						console.log('unknown migration');
					}
				};

				const version = await repository.find('meta', { type: 'api.version' });
				if (version == null) {
					migrate('0.2->0.3');
					console.log('migration to v0.3 has completed.');
				}
				else if (version.major == 0 && version.minor == 3) {
					console.log('there is no need for migration!');
				}
				else {
					console.log('failed to migration: unknown api version');
				}
			}
			await delay(400);
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
