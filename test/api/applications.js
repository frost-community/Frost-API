const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const routeApp = require('../../built/routes/applications');
const routeAppId = require('../../built/routes/applications/id');
const routeAppIdApplicationKey = require('../../built/routes/applications/id/application_key');

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

			appA = await db.applications.createAsync('generalapp_a', userA, 'this is generalapp.', []);
			appB = await db.applications.createAsync('generalapp_b', userB, 'this is generalapp.', []);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				let res = await routeApp.post({
					user: userA,
					body: {
						name: 'temp',
						description: 'hogehoge',
						permissions: []
					},
					db: db, config: config, checkRequestAsync: () => null
				});

				delete res.data.application.id;
				delete res.data.application.createdAt;
				assert.deepEqual(res.data, {
					application: {
						name: 'temp',
						creatorId: userA.document._id.toString(),
						description: 'hogehoge',
						permissions: []
					}
				});
			});

			it('nameが空もしくは33文字以上の場合は失敗する', async () => {
				let res = await routeApp.post({
					user: userA,
					body: {
						name: '',
						description: 'hogehoge',
						permissions: ''
					},
					db: db, config: config, checkRequestAsync: () => null
				});
				assert.equal(res.data, 'name is invalid format');

				res = await routeApp.post({
					user: userA,
					body: {
						name: 'superFrostersuperFrostersuperFros',
						description: 'hogehoge',
						permissions: ''
					},
					db: db, config: config, checkRequestAsync: () => null
				});
				assert.equal(res.data, 'name is invalid format');
			});

			it('descriptionが257文字以上のときは失敗する', async () => {
				let res = await routeApp.post({
					user: userA,
					body: {
						name: 'temp',
						description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
						permissions: ''
					},
					db: db, config: config, checkRequestAsync: () => null
				});
				assert.equal(res.data, 'description is invalid format');
			});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				let res = await routeApp.get({
					user: userA,
					params: {},
					body: {},
					db: db, config: config, checkRequestAsync: () => null
				});

				delete res.data.applications[0].id;
				delete res.data.applications[0].createdAt;
				assert.deepEqual(res.data, {
					applications: [{
						creatorId: userA.document._id.toString(),
						name: appA.document.name,
						description: appA.document.description,
						permissions: appA.document.permissions
					}]
				});
			});
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					let res = await routeAppId.get({
						user: userA,
						params: { id: appA.document._id.toString() },
						body: {},
						db: db, config: config, checkRequestAsync: () => null
					});

					delete res.data.application.id;
					delete res.data.application.createdAt;
					assert.deepEqual(res.data, {
						application: {
							creatorId: userA.document._id.toString(),
							name: appA.document.name,
							description: appA.document.description,
							permissions: appA.document.permissions
						}
					});
				});

				it('所有していないアプリケーションを指定された場合は失敗する', async () => {
					let res = await routeAppId.get({
						user: userA,
						params: { id: appB.document._id.toString() },
						body: {},
						db: db, config: config, checkRequestAsync: () => null
					});

					assert.equal(res.data, 'this operation is not permitted');
				});

				it('存在しないアプリケーションを指定した場合は204を返す', async () => {
					let res = await routeAppId.get({
						user: userA,
						params: { id: 'abcdefg1234' },
						body: {},
						db: db, config: config, checkRequestAsync: () => null
					});

					assert.equal(res.statusCode, 204);
				});
			});

			describe('/application_key', () => {
				describe('[POST]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						let res = await routeAppIdApplicationKey.post({
							user: userA,
							params: { id: appA.document._id.toString() },
							db: db, config: config, checkRequestAsync: () => null
						});

						await appA.fetchAsync();
						assert.deepEqual(res.data, {
							applicationKey: appA.getApplicationKey()
						});
					});

					it('所有していないアプリケーションを指定された場合は失敗する', async () => {
						let res = await routeAppIdApplicationKey.post({
							user: userB,
							params: { id: appA.document._id.toString() },
							db: db, config: config, checkRequestAsync: () => null
						});
						assert.equal(res.data, 'this operation is not permitted');
					});
				});

				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						const key = await appA.generateApplicationKeyAsync();

						const res = await routeAppIdApplicationKey.get({
							user: userA,
							params: { id: appA.document._id.toString() },
							db: db, config: config, checkRequestAsync: () => null
						});

						assert.deepEqual(res.data, {
							applicationKey: key
						});
					});

					it('持っていないアプリケーションを指定された場合は失敗する', async () => {
						await appB.generateApplicationKeyAsync();

						const res = await routeAppIdApplicationKey.get({
							user: userA,
							params: { id: appB.document._id.toString() },
							db: db, config: config, checkRequestAsync: () => null
						});
						assert.equal(res.data, 'this operation is not permitted');
					});
				});
			});
		});
	});
});
