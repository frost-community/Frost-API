const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const routeAuthTokens = require('../../src/routes/auth/tokens');

describe('Auth API', () => {
	describe('/auth/tokens', () => {
		let db, usersService, applicationsService;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			db = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('tokens', {});

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

			authInfo = { application: appA, scopes: ['auth.host'] };
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('tokens', {});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(db, config, {
					body: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeAuthTokens.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				assert(context.data.token.accessToken != null, 'accessToken is empty');
				delete context.data.token.accessToken;
				assert.deepEqual(context.data, {
					token: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					}
				});
			});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する(applicationId,userId,scopes)', async () => {
				// 生成
				let context = new ApiContext(db, config, {
					body: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeAuthTokens.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);

				// 取得
				context = new ApiContext(db, config, {
					body: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeAuthTokens.get(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				assert(context.data.token.accessToken != null, 'accessToken is empty');
				delete context.data.token.accessToken;
				assert.deepEqual(context.data, {
					token: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					}
				});
			});

			it('正しくリクエストされた場合は成功する(accessToken)', async () => {
				// 生成
				let context = new ApiContext(db, config, {
					body: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeAuthTokens.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				const accessToken = context.data.token.accessToken;

				// 取得
				context = new ApiContext(db, config, {
					body: {
						accessToken: accessToken
					},
					headers: { 'X-Api-Version': 1 },
					user: userA,
					authInfo: authInfo
				});
				await routeAuthTokens.get(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				assert(context.data.token.accessToken != null, 'accessToken is empty');
				delete context.data.token.accessToken;
				assert.deepEqual(context.data, {
					token: {
						applicationId: appA._id.toString(),
						userId: userA._id.toString(),
						scopes: []
					}
				});
			});
		});
	});
});
