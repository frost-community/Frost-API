const assert = require('assert');
const config = require('../../src/modules/loadConfig')();
const DbProvider = require('../../src/modules/dbProvider');
const Db = require('../../src/modules/db');
const ApiContext = require('../../src/modules/ApiContext');
const routeApp = require('../../src/routes/applications');
const routeAppId = require('../../src/routes/applications/id');
const routeAppIdApplicationKey = require('../../src/routes/applications/id/application_key');

describe('Applications API', () => {
	describe('/applications', () => {
		// load collections
		let db;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const dbProvider = await DbProvider.connectApidbAsync(config);
			db = new Db(config, dbProvider);

			await db.users.removeAsync({});
			await db.applications.removeAsync({});
		});

		// add general users, general applications
		let userA, userB, appA, appB;
		beforeEach(async () => {
			userA = await db.users.createAsync('generaluser_a', 'abcdefg', 'froster', 'this is generaluser.');
			userB = await db.users.createAsync('generaluser_b', 'abcdefg', 'froster', 'this is generaluser.');

			appA = await db.applications.createAsync('generalapp_a', userA, 'this is generalapp.', ['application', 'applicationSpecial']);
			appB = await db.applications.createAsync('generalapp_b', userB, 'this is generalapp.', ['application', 'applicationSpecial']);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						name: 'temp',
						description: 'hogehoge',
						permissions: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					application: appA
				});
				await routeApp.post(context);

				assert(typeof context.data != 'string', `api error: ${context.data}`);

				assert(context.data.application != null, `application is null. ${context.data}`);
				delete context.data.application.id;
				delete context.data.application.createdAt;
				assert.deepEqual(context.data, {
					application: {
						name: 'temp',
						creatorId: userA._id.toString(),
						description: 'hogehoge',
						permissions: []
					}
				});
			});

			it('nameが空もしくは33文字以上の場合は失敗する', async () => {
				let context = new ApiContext(null, null, db, config, {
					body: {
						name: '',
						description: 'hogehoge',
						permissions: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					application: appA
				});
				await routeApp.post(context);
				assert.equal(context.data, 'body parameter \'name\' is invalid');

				context = new ApiContext(null, null, db, config, {
					body: {
						name: 'superFrostersuperFrostersuperFros',
						description: 'hogehoge',
						permissions: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					application: appA
				});
				await routeApp.post(context);
				assert.equal(context.data, 'body parameter \'name\' is invalid');
			});

			it('descriptionが257文字以上のときは失敗する', async () => {
				const context = new ApiContext(null, null, db, config, {
					body: {
						name: 'temp',
						description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
						permissions: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					application: appA
				});
				await routeApp.post(context);
				assert.equal(context.data, 'body parameter \'description\' is invalid');
			});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(null, null, db, config, {
					headers: { 'X-Api-Version': 1 },
					user: userA,
					application: appA
				});
				await routeApp.get(context);

				assert(typeof context.data != 'string', `api error: ${context.data}`);

				delete context.data.applications[0].id;
				delete context.data.applications[0].createdAt;
				assert.deepEqual(context.data, {
					applications: [{
						creatorId: userA._id.toString(),
						name: appA.name,
						description: appA.description,
						permissions: appA.permissions
					}]
				});
			});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const context = new ApiContext(null, null, db, config, {
						params: { id: appA._id.toString() },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						application: appA
					});
					await routeAppId.get(context);

					assert(typeof context.data != 'string', `api error: ${context.data}`);

					delete context.data.application.id;
					delete context.data.application.createdAt;
					assert.deepEqual(context.data, {
						application: {
							creatorId: userA._id.toString(),
							name: appA.name,
							description: appA.description,
							permissions: appA.permissions
						}
					});
				});

				it('所有していないアプリケーションを指定された場合でも成功する', async () => {
					const context = new ApiContext(null, null, db, config, {
						params: { id: appB._id.toString() },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						application: appA
					});
					await routeAppId.get(context);
					assert.equal(context.statusCode, 200);
				});

				it('存在しないアプリケーションを指定した場合は204を返す', async () => {
					const context = new ApiContext(null, null, db, config, {
						params: { id: 'abcdefg1234' },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						application: appA
					});
					await routeAppId.get(context);
					assert.equal(context.statusCode, 204);
				});
			});

			describe('/application_key', () => {
				describe('[POST]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						const context = new ApiContext(null, null, db, config, {
							params: { id: appA._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userA,
							application: appA
						});
						await routeAppIdApplicationKey.post(context);

						assert(typeof context.data != 'string', `api error: ${context.data}`);

						await appA.fetchAsync();
						assert.deepEqual(context.data, {
							applicationKey: appA.getApplicationKey()
						});
					});

					it('所有していないアプリケーションを指定された場合は失敗する', async () => {
						const context = new ApiContext(null, null, db, config, {
							params: { id: appA._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userB,
							application: appB
						});
						await routeAppIdApplicationKey.post(context);
						assert.equal(context.data, 'this operation is not permitted');
					});
				});

				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						const key = await appA.generateApplicationKeyAsync();

						const context = new ApiContext(null, null, db, config, {
							params: { id: appA._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userA,
							application: appA
						});
						await routeAppIdApplicationKey.get(context);

						assert(typeof context.data != 'string', `api error: ${context.data}`);

						assert.deepEqual(context.data, {
							applicationKey: key
						});
					});

					it('持っていないアプリケーションを指定された場合は失敗する', async () => {
						await appB.generateApplicationKeyAsync();

						const context = new ApiContext(null, null, db, config, {
							params: { id: appB._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userA,
							application: appA
						});
						await routeAppIdApplicationKey.get(context);

						assert.equal(context.data, 'this operation is not permitted');
					});
				});
			});
		});
	});
});
