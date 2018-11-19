const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const routeStatus = require('../../src/routes/posts/post_status');

describe('Posts API', () => {
	describe('/posts', () => {
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

		// add general user, general application
		let user, app, authInfo;
		beforeEach(async () => {
			user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['postWrite']);

			authInfo = { application: app, scopes: ['post.write'] };
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('authorizeRequests', {});
			await db.remove('applicationAccesses', {});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
		describe('/post_status', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const context = new ApiContext(db, config, {
						params: { text: 'hogehoge' },
						headers: { 'X-Api-Version': 1 },
						user,
						authInfo: authInfo
					});
					await routeStatus.post(context);
					assert(context.data != null, 'no response');
					assert(context.statusCode == 200, `api error: ${context.data.message}`);
					delete context.data.postStatus.id;
					delete context.data.postStatus.createdAt;
					delete context.data.postStatus.user;
					assert.deepEqual(context.data, {
						postStatus: {
							text: 'hogehoge',
							type: 'status',
							userId: user._id.toString()
						}
					});
				});
			});
		});
		describe('/post_article', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
		describe('/post_reference', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
	});
});
