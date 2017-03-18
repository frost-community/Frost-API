'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const routeAccount = require('../../built/routes/account');
const routeApp = require('../../built/routes/applications');
const routeAppId = require('../../built/routes/applications/id');
const routeAppIdApplicationKey = require('../../built/routes/applications/id/application_key');
const Db = require('../../built/helpers/db');

describe('Applications API', () => {
	describe('/applications', () => {
		// load collections
		let db;
		before(done => {
			(async () => {
				try {
					config.api.database = config.api.testDatabase;
					db = new Db(config);
					await db.connectAsync();

					await db.users.removeAsync();
					await db.applications.removeAsync();

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
					let res = await db.users.createAsync({
						screenName: 'generaluser_a',
						passwordHash: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});
					userA = res.document;

					res = await db.users.createAsync({
						screenName: 'generaluser_b',
						passwordHash: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});
					userB = res.document;

					res = await routeApp.post({
						user: userA,
						body: {
							name: 'generalapp_a',
							description: 'this is generalapp.',
							permissions: []
						}
					}, null, db, config);
					assert.equal(res.message, 'success');
					appA = res.data.application;

					res = await routeApp.post({
						user: userB,
						body: {
							name: 'generalapp_b',
							description: 'this is generalapp.',
							permissions: []
						}
					}, null, db, config);
					assert.equal(res.message, 'success');
					appB = res.data.application;

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
							}
						}, null, db, config);

						assert.equal(res.message, 'success');

						delete res.data.application.id;
						assert.deepEqual(res.data, {
							application: {
								name: 'temp',
								creatorId: userA._id.toString(),
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
							}
						}, null, db, config);
						assert.equal(res.message, 'name is invalid format');

						res = await routeApp.post({
							user: userA,
							body: {
								name: 'superFrostersuperFrostersuperFros',
								description: 'hogehoge',
								permissions: ''
							}
						}, null, db, config);
						assert.equal(res.message, 'name is invalid format');

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
							}
						}, null, db, config);
						assert.equal(res.message, 'description is invalid format');

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
								params: {id: appA.id},
								body: {}
							}, null, db, config);

							assert.equal(res.message, 'success');

							assert.deepEqual(res.data, {
								application: {
									id: appA.id,
									creatorId: userA._id.toString(),
									name: appA.name,
									description: appA.description,
									permissions: appA.permissions
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
								params: {id: appB.id},
								body: {}
							}, null, db, config);

							assert.equal(res.message, 'you do not own this application');

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
								body: {}
							}, null, db, config);

							assert.equal(res.message, 'application is not found');

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
									params: {id: appA.id},
								}, null, db, config);
								assert.equal(res.message, 'success');

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
									params: {id: appA.id},
								}, null, db, config);
								assert.equal(res.message, 'you do not own this application');

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
								let res = await routeAppIdApplicationKey.post({
									user: userA,
									params: {id: appA.id},
								}, null, db, config);
								assert.equal(res.message, 'success');

								res = await routeAppIdApplicationKey.get({
									user: userA,
									params: {id: appA.id},
								}, null, db, config);
								assert.equal(res.message, 'success');

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
									params: {id: appB.id},
								}, null, db, config);
								assert.equal(res.message, 'success');

								res = await routeAppIdApplicationKey.get({
									user: userA,
									params: {id: appB.id},
								}, null, db, config);
								assert.equal(res.message, 'you do not own this application');

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
