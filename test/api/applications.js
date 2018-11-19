const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const routeApp = require('../../src/routes/applications');
const routeAppId = require('../../src/routes/applications/id');
const routeAppIdApplicationSecret = require('../../src/routes/applications/id/secret');

describe('Applications API', () => {
	describe('/applications', () => {
		let db, usersService, applicationsService;
		before(async () => {
			config.database = config.testDatabase;

			const authenticate = config.database.password != null ? `${config.database.username}:${config.database.password}` : config.database.username;
			db = await MongoAdapter.connect(config.database.host, config.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});

			usersService = new UsersService(db, config);
			applicationsService = new ApplicationsService(db, config);
		});

		// add general users, general applications
		let userA, userB, appA, appB, authInfo;
		beforeEach(async () => {
			userA = await usersService.create('generaluser_a', 'abcdefg', 'froster', 'this is generaluser.');
			userB = await usersService.create('generaluser_b', 'abcdefg', 'froster', 'this is generaluser.');

			appA = await applicationsService.create('generalapp_a', userA, 'this is generalapp.', ['application', 'applicationSpecial']);
			appB = await applicationsService.create('generalapp_b', userB, 'this is generalapp.', ['application', 'applicationSpecial']);

			authInfo = { application: appA, scopes: ['app.create', 'app.read', 'app.write', 'app.host'] };
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						name: 'temp',
						description: 'hogehoge',
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeApp.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				delete context.data.application.id;
				delete context.data.application.createdAt;
				assert.deepEqual(context.data, {
					application: {
						name: 'temp',
						creatorId: userA._id.toString(),
						description: 'hogehoge',
						scopes: []
					}
				});
			});

			it('nameが空もしくは33文字以上の場合は失敗する', async () => {
				let context = new ApiContext(db, config, {
					params: {
						name: '',
						description: 'hogehoge',
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeApp.post(context);

				assert(context.data != null, 'no response');
				assert(context.statusCode == 400 && context.data.message == 'parameter \'name\' is invalid', `api error: ${context.data.message}`);

				context = new ApiContext(db, config, {
					params: {
						name: 'superFrostersuperFrostersuperFros',
						description: 'hogehoge',
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeApp.post(context);

				assert(context.data != null, 'no response');
				assert(context.statusCode == 400 && context.data.message == 'parameter \'name\' is invalid', `api error: ${context.data.message}`);
			});

			it('descriptionが257文字以上のときは失敗する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						name: 'temp',
						description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeApp.post(context);

				assert(context.data != null, 'no response');
				assert(context.statusCode == 400 && context.data.message == 'parameter \'description\' is invalid', `api error: ${context.data.message}`);
			});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(db, config, {
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeApp.get(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				delete context.data.applications[0].id;
				delete context.data.applications[0].createdAt;
				assert.deepEqual(context.data, {
					applications: [{
						creatorId: userA._id.toString(),
						name: appA.name,
						description: appA.description,
						scopes: appA.scopes
					}]
				});
			});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const context = new ApiContext(db, config, {
						params: { id: appA._id.toString() },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						authInfo: authInfo
					});
					await routeAppId.get(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 200, `api error: ${context.data.message}`);
					delete context.data.application.id;
					delete context.data.application.createdAt;
					assert.deepEqual(context.data, {
						application: {
							creatorId: userA._id.toString(),
							name: appA.name,
							description: appA.description,
							scopes: appA.scopes
						}
					});
				});

				it('所有していないアプリケーションを指定された場合でも成功する', async () => {
					const context = new ApiContext(db, config, {
						params: { id: appB._id.toString() },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						authInfo: authInfo
					});
					await routeAppId.get(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 200, `api error: ${context.data.message}`);
				});

				it('存在しないアプリケーションを指定した場合は404を返す', async () => {
					const context = new ApiContext(db, config, {
						params: { id: 'abcdefg1234' },
						headers: { 'X-Api-Version': 1 },
						user: userA,
						authInfo: authInfo
					});
					await routeAppId.get(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 404, `api error: ${context.data.message}`);
				});
			});

			describe('/secret', () => {
				describe('[POST]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						const context = new ApiContext(db, config, {
							params: { id: appA._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userA,
							authInfo: authInfo
						});
						await routeAppIdApplicationSecret.post(context);
						assert(context.data != null, 'no response');
						assert(context.statusCode == 200, `api error: ${context.data.message}`);

						appA = await db.findById('applications', appA._id);
						assert.deepEqual(context.data, {
							secret: applicationsService.getApplicationSecret(appA)
						});
					});
				});

				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						const secret = await applicationsService.generateApplicationSecret(appA);

						const context = new ApiContext(db, config, {
							params: { id: appA._id.toString() },
							headers: { 'X-Api-Version': 1 },
							user: userA,
							authInfo: authInfo
						});
						await routeAppIdApplicationSecret.get(context);
						assert(context.data != null, 'no response');
						assert(context.statusCode == 200, `api error: ${context.data.message}`);
						assert.deepEqual(context.data, {
							secret
						});
					});
				});
			});
		});
	});
});
