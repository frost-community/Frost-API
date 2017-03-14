'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const collections = require('../../built/helpers/collections');
const usersAsync = collections.users;
const applicationsAsync = collections.applications;
const routeAccount = require('../../built/routes/account');
const routeApp = require('../../built/routes/applications');
const routeAppId = require('../../built/routes/applications/id');
const routeAppIdApplicationKey = require('../../built/routes/applications/id/application_key');

describe('API', () => {
	// load collections
	let users, applications;
	before(done => {
		(async () => {
			try {
				config.api.database = config.api.testDatabase;
				users = await usersAsync(config);
				applications = await applicationsAsync(config);

				await users.removeAsync();
				await applications.removeAsync();

				done();
			}
			catch(e) {
				done(e);
			}
		})();
	});

	describe('/applications', () => {
		// add general users, general applications
		let accountA, accountB, appA, appB;
		before(done => {
			(async () => {
				try {
					let res = await routeAccount.post({
						body: {
							screenName: 'generaluser_a',
							password: 'abcdefg',
							name: 'froster',
							description: 'this is generaluser.'
						}
					}, null, config);
					assert.equal(res.statusCode, 200);
					accountA = res.data.user;

					res = await routeAccount.post({
						body: {
							screenName: 'generaluser_b',
							password: 'abcdefg',
							name: 'froster',
							description: 'this is generaluser.'
						}
					}, null, config);
					assert.equal(res.statusCode, 200);
					accountB = res.data.user;

					res = await routeApp.post({
						user: {id: accountA.id},
						body: {
							name: 'generalapp_a',
							description: 'this is generalapp.',
							permissions: []
						}
					}, null, config);
					assert.equal(res.statusCode, 200);
					appA = res.data.application;

					res = await routeApp.post({
						user: {id: accountB.id},
						body: {
							name: 'generalapp_b',
							description: 'this is generalapp.',
							permissions: []
						}
					}, null, config);
					assert.equal(res.statusCode, 200);
					appB = res.data.application;

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		// remove general users, general applications
		after(done => {
			(async () => {
				try {
					await users.removeAsync({screenName: /general/});
					await applications.removeAsync({screenName: /general/});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		describe('POST', () => {
			// general以外のアプリケーションを削除
			afterEach(done => {
				(async () => {
					try {
						await applications.removeAsync({screenName: /^(general)/});

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});

			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					try {
						let res = await routeApp.post({
							user: {id: accountA.id},
							body: {
								name: 'temp',
								description: 'hogehoge',
								permissions: []
							}
						}, null, config);

						assert.equal(res.statusCode, 200);

						delete res.data.application.id;
						assert.deepEqual(res.data, {
							application: {
								name: 'temp',
								creatorId: accountA.id,
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
							user: {id: accountA.id},
							body: {
								name: '',
								description: 'hogehoge',
								permissions: ''
							}
						}, null, config);
						assert.equal(res.statusCode, 400);

						res = await routeApp.post({
							user: {id: accountA.id},
							body: {
								name: 'superFrostersuperFrostersuperFros',
								description: 'hogehoge',
								permissions: ''
							}
						}, null, config);
						assert.equal(res.statusCode, 400);

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
							user: {id: accountA.id},
							body: {
								name: 'temp',
								description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget',
								permissions: ''
							}
						}, null, config);
						assert.equal(res.statusCode, 400);

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});
		});

		describe('GET  /applications/id', () => {
			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					try {
						let res = await routeAppId.get({
							user: {id: accountA.id},
							params: {id: appA.id},
							body: {}
						}, null, config);

						assert.equal(res.statusCode, 200);

						assert.deepEqual(res.data, {
							application: {
								id: appA.id,
								creatorId: accountA.id,
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
							user: {id: accountA.id},
							params: {id: appB.id},
							body: {}
						}, null, config);

						assert.equal(res.statusCode, 400);

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
							user: {id: accountA.id},
							params: {id: 'abcdefg1234'},
							body: {}
						}, null, config);

						assert.equal(res.statusCode, 400);

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});
		});

		describe('POST /applications/id/application_key', () => {
			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					try {
						let res = await routeAppIdApplicationKey.post({params: {id: 'application_id_hoge'}}, null, config);

						assert.equal(res.statusCode, 200);

						assert.deepEqual(res.data, {
							application_key: 'application_key_hoge'
						});

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});
		});

		describe('GET  /applications/id/application_key', () => {
			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					try {
						let res = await routeAppIdApplicationKey.get({params: {id: 'application_id_hoge'}}, null, config);

						assert.equal(res.statusCode, 200);

						assert.deepEqual(res.data, {
							application_key: 'application_key_hoge'
						});

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
