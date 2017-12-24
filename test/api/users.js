const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const ApiContext = require('../../built/helpers/ApiContext');
const route = require('../../built/routes/users');
const routeId = require('../../built/routes/users/id');

describe('Users API', () => {
	describe('/users', () => {
		// load collections
		let db;
		before(async () => {
			config.api.database = config.api.testDatabase;
			const dbProvider = await DbProvider.connectApidbAsync(config);
			db = new Db(config, dbProvider);

			await db.users.removeAsync({});
			await db.applications.removeAsync({});
		});

		// add general user, general application
		let user, app;
		beforeEach(async () => {
			user = await db.users.createAsync('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			app = await db.applications.createAsync('generalapp', user, 'this is generalapp.', []);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
			await db.authorizeRequests.removeAsync({});
			await db.applicationAccesses.removeAsync({});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const context = new ApiContext(null, null, db, config, {
					params: { id: user.document._id },
					query: { 'screen_names': user.document.screenName },
					headers: { 'X-Api-Version': 1 },
					testMode: true
				});
				context.user = user;
				await route.get(context);

				delete context.data.users[0].id;
				delete context.data.users[0].createdAt;
				assert.deepEqual(context.data, {
					users: [{
						screenName: user.document.screenName,
						name: user.document.name,
						description: user.document.description
					}]
				});
			});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const context = new ApiContext(null, null, db, config, {
						params: { id: user.document._id },
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					context.user = user;
					await routeId.get(context);

					delete context.data.user.id;
					delete context.data.user.createdAt;
					assert.deepEqual(context.data, {
						user: {
							screenName: user.document.screenName,
							name: user.document.name,
							description: user.document.description
						}
					});
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
