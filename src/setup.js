const uid = require('uid2');
const readLine = require('./modules/readline');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');
const ConsoleMenu = require('./modules/ConsoleMenu');
const UsersService = require('./services/UsersService');
const ApplicationsService = require('./services/ApplicationsService');
const TokensService = require('./services/TokensService');
const scopes = require('./modules/scopes');
const checkDataFormat = require('./modules/checkDataFormat');

const dataFormatVersion = 1;

const q = async str => (await readLine(str)).toLowerCase().indexOf('y') === 0;

module.exports = async () => {
	console.log('## Setup Mode');

	try {
		console.log('loading config ...');
		const config = loadConfig();
		if (config == null) {
			console.log('config.json does not exist. please create by command. (command: npm run generate-configs)');
			return;
		}

		console.log('connecting database ...');
		const authenticate = config.database.password != null ? `${config.database.username}:${config.database.password}` : config.database.username;
		const repository = await MongoAdapter.connect(config.database.host, config.database.database, authenticate);

		console.log('checking dataFormat ...');
		const dataFormatState = await checkDataFormat(repository, dataFormatVersion);

		let stateMessage = 'unknown';
		if (dataFormatState == 0) stateMessage = 'executable';
		if (dataFormatState == 1) stateMessage = 'need initialization';
		if (dataFormatState == 2) stateMessage = 'need migration';
		console.log('dataFormat state:', stateMessage);

		const usersService = new UsersService(repository, config);
		const applicationsService = new ApplicationsService(repository, config);
		const tokensService = new TokensService(repository, config);

		const menu = new ConsoleMenu();
		menu.add('exit setup', async (ctx) => {
			ctx.exit();
		});
		menu.add('initialize (register root application and root user)', async (ctx) => {
			// なんらかの保存されたデータがあるとき
			if (dataFormatState != 1) {
				if (!(await q('(!) are you sure you want to REMOVE ALL COLLECTIONS and ALL DOCUMENTS in target database? (y/n) > '))) {
					return;
				}

				const clean = async (collection) => {
					await repository.remove(collection, {});
					console.log(`cleaned ${collection} collection.`);
				};
				await clean('meta');
				await clean('applications');
				await clean('tokens');
				await clean('users');
				await clean('userFollowings');
				await clean('posts');
				await clean('storageFiles');
			}

			let appName = await readLine('application name(default: Frost Web) > ');
			if (appName == '') {
				appName = 'Frost Web';
			}

			const user = await usersService.create('frost', null, 'Frost公式', 'オープンソースSNS Frostです。', { root: true });
			console.log('root user created.');

			await applicationsService.create(appName, user, user.description, scopes.map(s => s.name), { root: true });
			console.log('root application created.');

			await repository.create('meta', { type: 'dataFormat', value: dataFormatVersion });
			ctx.exit();
		});
		// WARN: アンコメントすると、root applicationの認可付与に必要なapplicationSecretを生成可能になります。
		// このapplicationSecretは漏洩するとAPIのフルアクセスが可能になってしまうため、必要なときにだけ生成すべきです。
		/*
		if (dataFormatState == 0) {
			menu.add('generate applicationSecret for root application', async () => {
				let rootApp = await repository.find('applications', { root: true });
				const applicationSecret = await applicationsService.generateApplicationSecret(rootApp);
				console.log(`applicationSecret generated. (secret: ${applicationSecret})`);
			});
		}
		*/
		if (dataFormatState == 0) {
			menu.add('generate or get token for authorization host', async (ctx) => {
				const rootUser = await repository.find('users', { root: true });
				let rootApp = await repository.find('applications', { root: true });
				if (rootApp != null) {
					let hostToken = await repository.find('tokens', { host: true });

					if (hostToken == null) {
						hostToken = await tokensService.create(rootApp, rootUser, ['user.read', 'app.host', 'auth.host', 'user.create', 'user.delete'], { host: true });
						console.log('host token created:');
					}
					else {
						console.log('host token found:');
					}
					console.log(hostToken);
				}
				ctx.exit();
			});
		}
		if (dataFormatState == 2) {
			menu.add('migrate from old data formats', async (ctx) => {
				const migrate = async (migrationId) => {
					if (migrationId == 'empty->1') {
						// NOTE: applicationKeyが発行されていたアプリケーションは、移行すると代わりにapplicationSecret(seed)が登録されます。
						console.log('migrating to v1 ...');
						const applications = await repository.findArray('applications', {});
						const rootAppId = applications.length >= 1 ? applications[0]._id : null;

						for(const app of applications) {
							// "permissions" -> "scopes"
							const scopesConversionTable = {
								iceAuthHost: 'auth.host',
								application: ['app.read', 'app.write'],
								applicationSpecial: ['app.host', 'app.create'],
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

							if (app.keyCode != null) {
								delete app.keyCode;
								app.seed = uid(8);
							}

							// root application なら
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

						await repository.create('meta', { type: 'dataFormat', value: 1 });
					}
					else {
						console.log('unknown migration');
					}
				};

				const dataFormat = await repository.find('meta', { type: 'dataFormat' });
				if (dataFormat == null) {
					await migrate('empty->1');
					console.log('migration to v1 has completed.');
					ctx.exit();
				}
				else {
					console.log('failed to migration: unknown dataFormat');
				}
			});
		}
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
