'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
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
				let res = await route.get({
					user: user,
					params: { id: user.document._id },
					query: { 'screen_names': user.document.screenName },
					body: {},
					db: db, config: config, checkRequestAsync: () => null
				});

				delete res.data.users[0].id;
				delete res.data.users[0].createdAt;
				assert.deepEqual(res.data, {
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
					let res = await routeId.get({
						user: user,
						params: { id: user.document._id },
						body: {},
						db: db, config: config, checkRequestAsync: () => null
					});

					delete res.data.user.id;
					delete res.data.user.createdAt;
					assert.deepEqual(res.data, {
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
