'use strict';

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
		before(done => {
			(async () => {
				try {
					config.api.database = config.api.testDatabase;

					const dbProvider = await DbProvider.connectApidbAsync(config);
					db = new Db(config, dbProvider);

					await db.users.removeAsync({});
					await db.applications.removeAsync({});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		// add general users, general applications
		let userA, userB, appA, appB;
		beforeEach(done => {
			(async () => {
				try {
					userA = await db.users.createAsync({
						screenName: 'generaluser_a',
						passwordHash: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});

					userB = await db.users.createAsync({
						screenName: 'generaluser_b',
						passwordHash: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});

					appA = await db.applications.createAsync({
						name: 'generalapp_a',
						creatorId: userA.document._id,
						description: 'this is generalapp.',
						permissions: []
					});

					appB = await db.applications.createAsync({
						name: 'generalapp_b',
						creatorId: userB.document._id,
						description: 'this is generalapp.',
						permissions: []
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		// remove all users, all applications
		afterEach(done => {
			(async () => {
				try {
					await db.users.removeAsync({});
					await db.applications.removeAsync({});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					try {
						let res = await routeApp.post({
							user: userA,
							body: {
								name: 'temp',
								description: 'hogehoge',
								permissions: []
							},
							db: db, config: config
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
						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});

			it('nameが空もしくは33文字以上の場合は失敗する', done => {
				(async () => {
					try {
						let res = await routeApp.post({
							user: userA,
							body: {
								name: '',
								description: 'hogehoge',
								permissions: ''
							},
							db: db, config: config
						});
						assert.equal(res.data, 'name is invalid format');

						res = await routeApp.post({
							user: userA,
							body: {
								name: 'superFrostersuperFrostersuperFros',
								description: 'hogehoge',
								permissions: ''
							},
							db: db, config: config
						});
						assert.equal(res.data, 'name is invalid format');

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});

			it('descriptionが257文字以上のときは失敗する', done => {
				(async () => {
					try {
						let res = await routeApp.post({
							user: userA,
							body: {
								name: 'temp',
								description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
								permissions: ''
							},
							db: db, config: config
						});
						assert.equal(res.data, 'description is invalid format');

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});
		});

		describe('/id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							let res = await routeAppId.get({
								user: userA,
								params: {id: appA.document._id.toString()},
								body: {},
								db: db, config: config
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

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});

				it('所有していないアプリケーションを指定された場合は失敗する', done => {
					(async () => {
						try {
							let res = await routeAppId.get({
								user: userA,
								params: {id: appB.document._id.toString()},
								body: {},
								db: db, config: config
							});

							assert.equal(res.data, 'you do not own this application');

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});

				it('存在しないアプリケーションを指定された場合は失敗する', done => {
					(async () => {
						try {
							let res = await routeAppId.get({
								user: userA,
								params: {id: 'abcdefg1234'},
								body: {},
								db: db, config: config
							});

							assert.equal(res.data, 'application is not found');

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});
			});

			describe('/application_key', () => {
				describe('[POST]', () => {
					it('正しくリクエストされた場合は成功する', done => {
						(async () => {
							try {
								let res = await routeAppIdApplicationKey.post({
									user: userA,
									params: {id: appA.document._id.toString()},
									db: db, config: config
								});

								await appA.fetchAsync();
								assert.deepEqual(res.data, {
									applicationKey: appA.getApplicationKey()
								});

								done();
							}
							catch(e) {
								done(e);
							}
						})();
					});

					it('所有していないアプリケーションを指定された場合は失敗する', done => {
						(async () => {
							try {
								let res = await routeAppIdApplicationKey.post({
									user: userB,
									params: {id: appA.document._id.toString()},
									db: db, config: config
								});
								assert.equal(res.data, 'you do not own this application');

								done();
							}
							catch(e) {
								done(e);
							}
						})();
					});
				});

				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', done => {
						(async () => {
							try {
								const key = await appA.generateApplicationKeyAsync();

								const res = await routeAppIdApplicationKey.get({
									user: userA,
									params: {id: appA.document._id.toString()},
									db: db, config: config
								});

								assert.deepEqual(res.data, {
									applicationKey: key
								});

								done();
							}
							catch(e) {
								done(e);
							}
						})();
					});

					it('持っていないアプリケーションを指定された場合は失敗する', done => {
						(async () => {
							try {
								await appB.generateApplicationKeyAsync();

								const res = await routeAppIdApplicationKey.get({
									user: userA,
									params: {id: appB.document._id.toString()},
									db: db, config: config
								});
								assert.equal(res.data, 'you do not own this application');

								done();
							}
							catch(e) {
								done(e);
							}
						})();
					});
				});
			});
		});
	});
});
