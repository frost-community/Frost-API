const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const ApiContext = require('../../built/helpers/ApiContext');
const route = require('../../built/routes/account');

describe('Account API', () => {
	describe('/account', () => {
		let db;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const dbProvider = await DbProvider.connectApidbAsync(config);
			db = new Db(config, dbProvider);

			await db.users.removeAsync({});
			await db.applications.removeAsync({});
		});

		// add general user, general application
		let user, application;
		beforeEach(async () => {
			user = await db.users.createAsync('generaluser_a', 'abcdefg', 'froster', 'this is generaluser.');
			application = await db.applications.createAsync('generalapp_a', user, 'this is generalapp.', ['accountSpecial']);
		});

		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
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
						description: 'testhoge'
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
