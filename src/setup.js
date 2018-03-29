const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const semver = require('semver');
const request = promisify(require('request'));
const readLine = require('./modules/readline');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');
const ConsoleMenu = require('./modules/ConsoleMenu');
const UsersService = require('./services/UsersService');
const ApplicationsService = require('./services/ApplicationsService');
const TokensService = require('./services/TokensService');
const scopes = require('./modules/scopes');

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
				const parent = await q('generate config.json in the parent directory of repository? (y/n) > ');
				const configPath = path.resolve(parent ? '../config.json' : 'config.json');
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

		const menu = new ConsoleMenu();
		menu.add('exit setup', async (ctx) => {
			ctx.exit();
		});
		menu.add('register root application and root user', async () => {
			let rootApp = await repository.find('applications', { root: true });
			if (rootApp == null) {
				let appName = await readLine('application name(default: Frost Web) > ');

				if (appName == '') {
					appName = 'Frost Web';
				}

				const user = await usersService.create('frost', null, 'Frost公式', 'オープンソースSNS Frostです。', { root: true });
				console.log('root user created.');

				const rootApp = applicationsService.create(appName, user, user.description, scopes.map(s => s.name), { root: true });
				console.log('root application created.');
			}
			else {
				console.log('root application is already exists.');
			}
		});
		// WARN: アンコメントすると、root applicationの認可付与に必要なapplicationSecretを生成可能になります。
		// このapplicationSecretは漏洩するとAPIのフルアクセスが可能になってしまうため、必要なときにだけ生成すべきです。
		/*
		menu.add('generate applicationSecret for root application', async () => {
			let rootApp = await repository.find('applications', { root: true });
			const applicationSecret = await applicationsService.generateApplicationSecret(rootApp);
			console.log(`applicationSecret generated. (secret: ${applicationSecret})`);
		});
		*/
		menu.add('generate or get token for authorization host', async () => {
			const rootUser = await repository.find('users', { root: true });
			let rootApp = await repository.find('applications', { root: true });
			if (rootApp != null) {
				let hostToken = await repository.find('tokens', { host: true });

				if (hostToken == null) {
					hostToken = await tokensService.create(rootApp, rootUser, ['app.host', 'auth.host', 'user.create', 'user.delete'], { host: true });
					console.log('host token created:');
				}
				else {
					console.log('host token found:');
				}
				console.log(hostToken);
			}
		});
		menu.add('migrate from old data formats', async () => {
			const migrate = async (migrationId) => {
				if (migrationId == 'empty->0.3') {
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

						// add root flag
						if (app._id.equals(rootAppId)) {
							app.root = true;
							delete app.seed;
						}

						await repository.update('applications', { _id: app._id }, app, { renewal: true });
						console.log(`migrated application: ${app._id.toString()}`);
					}

					const users = await repository.findArray('users', {});
					if (users.length > 0) {
						const rootUser = users[0];
						// add root flag
						await repository.update('users', { _id: rootUser._id }, { root: true });
						console.log(`migrated root user: ${rootUser._id.toString()}`);
					}

					await repository.drop('applicationAccesses');
					console.log('droped applicationAccesses collection');

					await repository.drop('authorizeRequests');
					console.log('droped authorizeRequests collection');

					await repository.create('meta', { type: 'dataFormat', value: '0.3.0' });
				}
				else {
					console.log('unknown migration');
				}
			};

			const dataFormat = await repository.find('meta', { type: 'dataFormat' });
			if (dataFormat == null) {
				await migrate('empty->0.3');
				console.log('migration to v0.3 has completed.');
			}
			else if (semver.eq(dataFormat.value, '0.3.0')) {
				console.log('there is no need for migration!');
			}
			else {
				console.log('failed to migration: unknown api version');
			}
		});
		menu.add('remove all documents on all db collections', async () => {
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
		});
		await menu.show();

		console.log('disconnecting database ...');
		await repository.disconnect();
		console.log('disconnected');
	}
	catch (err) {
		console.log('Unprocessed Setup Error:', err);
	}
	console.log('## End Setup Mode');
};
