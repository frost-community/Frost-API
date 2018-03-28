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
			console.log('1: generate root application for authorization host (Frost-Web etc.)');
			console.log('2: migrate from old frost-api versions');
			console.log('3: remove all documents on all db collections');
			const number = parseInt(await readLine('> '));

			if (number == 0) {
				isExit = true;
			}
			else if (number == 1) {
				const rootApp = await repository.find('applications', { root: true });
				if (rootApp == null) {
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
				else {
					console.log('root application is already exists.');
				}
			}
			else if (number == 2) {
				const migrate = async (migrationId) => {
					if (migrationId == '0.2->0.3') {
						console.log('migrating to v0.3 ...');
						const applications = await repository.findArray('applications', {});
						const rootAppId = applications.length >= 1 ? applications[0]._id : null;

						for(const app of applications) {
							// "permissions" -> "scopes"
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

							app.scopes = [];
							for(let p of app.permissions) {
								let newName = scopesConversionTable[p];
								if (newName != null) {
									if (Array.isArray(newName))
										app.scopes.push(...newName);
									else
										app.scopes.push(newName);
								}
							}
							delete app.permissions;

							// keyCode -> seed
							if (app.keyCode != null) {
								app.seed = app.keyCode;
								delete app.keyCode;
							}

							// root app flag
							if (app._id.equals(rootAppId)) {
								app.root = true;
							}

							await repository.update('applications', { _id: app._id }, app, { renewal: true });
							console.log(`migrated application: ${app._id.toString()}`);
						}

						await repository.drop('applicationAccesses');
						console.log('droped applicationAccesses collection');

						await repository.drop('authorizeRequests');
						console.log('droped authorizeRequests collection');

						await repository.create('meta', { type: 'api.version', major: 0, minor: 3 });
					}
					else {
						console.log('unknown migration');
					}
				};

				const version = await repository.find('meta', { type: 'api.version' });
				if (version == null) {
					await migrate('0.2->0.3');
					console.log('migration to v0.3 has completed.');
				}
				else if (version.major == 0 && version.minor == 3) {
					console.log('there is no need for migration!');
				}
				else {
					console.log('failed to migration: unknown api version');
				}
			}
			else if (number == 3) {
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
