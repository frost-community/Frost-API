const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const route = require('../../src/routes/users');
const routeId = require('../../src/routes/users/id');

describe('Users API', () => {
	describe('/users', () => {
		// load collections
		let db, usersService, applicationsService;
		before(async () => {
			config.database = config.testDatabase;

			const authenticate = config.database.password != null ? `${config.database.username}:${config.database.password}` : config.database.username;
			db = await MongoAdapter.connect(config.database.host, config.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('authorizeRequests', {});
			await db.remove('applicationAccesses', {});

			usersService = new UsersService(db, config);
			applicationsService = new ApplicationsService(db, config);
		});

		// add general user, general application
		let user, application, authInfo;
		beforeEach(async () => {
			user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			application = await applicationsService.create('generalapp', user, 'this is generalapp.', ['user.read', 'user.create']);

			authInfo = { application: application, scopes: ['user.read', 'user.create'] };
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('authorizeRequests', {});
			await db.remove('applicationAccesses', {});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(db, config, {
					params: { id: user._id },
					params: { 'screen_names': user.screenName },
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.get(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);
				delete context.data.users[0].id;
				delete context.data.users[0].createdAt;
				assert.deepEqual(context.data, {
					users: [{
						screenName: user.screenName,
						name: user.name,
						description: user.description,
						followersCount: 0,
						followingsCount: 0,
						postsCount: { status: 0 }
					}]
				});
			});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 200, `api error: ${context.data.message}`);

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
				let context = new ApiContext(db, config, {
					params: {
						screenName: 'abc',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 400, `api error: ${context.data.message}`);

				context = new ApiContext(db, config, {
					params: {
						screenName: 'abcdefghijklmnop',
						password: 'a1b2c3d4e5f6g',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 400, `api error: ${context.data.message}`);
			});

			it('passwordが6文字未満のときは失敗する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						screenName: 'hogehoge',
						password: 'a1b2c',
						name: 'froster',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 400, `api error: ${context.data.message}`);
			});

			it('nameが33文字以上のときは失敗する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: 'superFrostersuperFrostersuperFros',
						description: 'testhoge'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 400, `api error: ${context.data.message}`);
			});

			it('descriptionが257文字以上のときは失敗する', async () => {
				const context = new ApiContext(db, config, {
					params: {
						screenName: 'hogehoge',
						password: 'a1b2c3d4e5f6g',
						name: '',
						description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget'
					},
					headers: { 'X-Api-Version': 1 },
					user,
					authInfo
				});
				await route.post(context);
				assert(context.data != null, 'no response');
				assert(context.statusCode == 400, `api error: ${context.data.message}`);
			});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const context = new ApiContext(db, config, {
						params: { id: user._id },
						headers: { 'X-Api-Version': 1 },
						user,
						authInfo
					});
					await routeId.get(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 200, `api error: ${context.data.message}`);
					delete context.data.user.id;
					delete context.data.user.createdAt;
					assert.deepEqual(context.data, {
						user: {
							screenName: user.screenName,
							name: user.name,
							description: user.description,
							followersCount: 0,
							followingsCount: 0,
							postsCount: { status: 0 }
						}
					});
				});
				it('存在しないユーザーを指定した場合は404を返す', async () => {
					const context = new ApiContext(db, config, {
						params: { id: 'abcdefg1234' },
						headers: { 'X-Api-Version': 1 },
						user,
						authInfo
					});
					await routeId.get(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 404, `api error: ${context.data.message}`);
				});
			});
			describe('/timelines/user', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/timelines/home', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/followings', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
				describe('/:target_id', () => {
					describe('[GET]', () => {
						it('正しくリクエストされた場合は成功する');
					});
					describe('[PUT]', () => {
						it('正しくリクエストされた場合は成功する');
					});
					describe('[DELETE]', () => {
						it('正しくリクエストされた場合は成功する');
					});
				});
			});
			describe('/followers', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
