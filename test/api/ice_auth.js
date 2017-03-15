'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const authorizeRequestModelAsync = require('../../built/models/authorizeRequest');
const routeRequest = require('../../built/routes/ice_auth/request');
const routeVerificationCode = require('../../built/routes/ice_auth/verification_code');
const routeAuthorize = require('../../built/routes/ice_auth/authorize');
const dbAsync = require('../../built/helpers/db');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
		// load collections
		let db, authorizeRequestModel;
		before(done => {
			(async () => {
				try {
					config.api.database = config.api.testDatabase;
					db = await dbAsync(config);
					authorizeRequestModel = await authorizeRequestModelAsync(db, config);

					await db.users.removeAsync();
					await db.applications.removeAsync();

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		// add general user, general application
		let user, app;
		beforeEach(done => {
			(async () => {
				try {
					let res = await db.users.createAsync({
						screenName: 'generaluser',
						passwordHash: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});
					user = res;

					res = await db.applications.createAsync({
						name: 'generalapp',
						description: 'this is generalapp.',
						permissions: []
					});
					app = res;

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

		describe('/request', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							const applicationKey = await app.generateApplicationKeyAsync();

							let res = await routeRequest.post({
								body: {
									application_key: applicationKey
								}
							}, null, db, config);
							assert.equal(res.message, 'success');
							assert(await authorizeRequestModel.verifyKeyAsync(res.data.request_key));

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});
			});
		});

		describe('/verification_code', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							let res = await routeVerificationCode.get({
								body: {
									application_key: 'application_key_hoge',
									request_key: 'request_key_hoge'
								}
							}, null, db, config);

							assert.equal(res.message, 'success');

							assert.deepEqual(res.data, {
								verification_code: 'verification_code_hoge'
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

		describe('/authorize', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							let res = await routeAuthorize.post({
								body: {
									application_key: 'application_key_hoge',
									request_key: 'request_key_hoge',
									verification_code: 'verification_code_hoge'
								}
							}, null, db, config);

							assert.equal(res.message, 'success');

							assert.deepEqual(res.data, {
								access_key: 'access_key_hoge'
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
});
