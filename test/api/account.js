const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const route = require('../../src/routes/account');

describe('Account API', () => {
	describe('/account', () => {
		let db, usersService, applicationsService;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			db = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});

			usersService = new UsersService(db, config);
			applicationsService = new ApplicationsService(db, config);
		});

		// add general user, general application
		let user, application;
		beforeEach(async () => {
			user = await usersService.create('generaluser_a', 'abcdefg', 'froster', 'this is generaluser.');
			application = await applicationsService.create('generalapp_a', user, 'this is generalapp.', ['accountSpecial']);
		});

		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});
				await route.post(context);

				assert(typeof context.data != 'string', `api error: ${context.data}`);

				delete context.data.user.id;
				delete context.data.user.createdAt;
				assert.deepEqual(context.data, {
					user: {
						screenName: 'hogehoge',
						name: 'froster',
						description: 'testhoge',
						followersCount: 0,
						followingsCount: 0,
						postsCount: { status: 0 }
					}
				});
			});

			it('screenNameが4文字未満もしくは16文字以上のとき失敗する', async () => {
				let context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'abc',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});

				await route.post(context);
				assert.equal(context.statusCode, 400);

				context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'abcdefghijklmnop',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});

				await route.post(context);
				assert.equal(context.statusCode, 400);
			});

			it('passwordが6文字未満のときは失敗する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'hogehoge',
						password: 'a1b2c',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});

				await route.post(context);
				assert.equal(context.statusCode, 400);
			});

			it('nameが33文字以上のときは失敗する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: 'superFrostersuperFrostersuperFros',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});

				await route.post(context);
				assert.equal(context.statusCode, 400);
			});

			it('descriptionが257文字以上のときは失敗する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: '',
						description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application
				});

				await route.post(context);
				assert.equal(context.statusCode, 400);
			});
		});
	});
});
