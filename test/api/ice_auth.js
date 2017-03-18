'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const Db = require('../../built/helpers/db');
const AuthorizeRequest = require('../../built/documentModels/authorizeRequest');
const ApplicationAccess = require('../../built/documentModels/applicationAccess');
const route = require('../../built/routes/ice_auth');
const routeVerificationCode = require('../../built/routes/ice_auth/verification_code');
const routeTargetUser = require('../../built/routes/ice_auth/target_user');
const routeAccessKey = require('../../built/routes/ice_auth/access_key');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
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
						creatorId: user.document._id,
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
					await db.authorizeRequests.removeAsync({});
					await db.applicationAccesses.removeAsync({});

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
						const applicationKey = await app.generateApplicationKeyAsync();

						let res = await route.post({
							body: {
								application_key: applicationKey
							}
						}, null, db, config);
						assert.equal(res.message, null);
						assert(await AuthorizeRequest.verifyKeyAsync(res.data.ice_auth_key, db, config));

						done();
					}
					catch(e) {
						done(e);
					}
				})();
			});
		});

		describe('/verification_code', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							let res = await route.post({
								body: {
									application_key: await app.generateApplicationKeyAsync()
								}
							}, null, db, config);
							assert.equal(res.message, null);

							res = await routeVerificationCode.get({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') return res.data.ice_auth_key;
									return null;
								}
							}, null, db, config);
							assert.equal(res.message, null);
							assert(/^[A-Z0-9]+$/.test(res.data.verification_code));

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});
			});
		});

		describe('/target_user', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							// ice_auth_key
							let res = await route.post({
								body: {
									application_key: await app.generateApplicationKeyAsync()
								}
							}, null, db, config);
							assert.equal(res.message, null);

							// target_user
							res = await routeTargetUser.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') return res.data.ice_auth_key;
									return null;
								},
								body: {
									ice_auth_key: res.data.ice_auth_key,
									user_id: user.document._id.toString()
								}
							}, null, db, config);
							assert.equal(res.message, null);

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});
			});
		});

		describe('/access_key', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							// ice_auth_key
							let res = await route.post({
								body: {
									application_key: await app.generateApplicationKeyAsync()
								}
							}, null, db, config);
							assert.equal(res.message, null);

							const authorizeRequest = await db.authorizeRequests.findIdAsync(AuthorizeRequest.splitKey(res.data.ice_auth_key, db, config).authorizeRequestId);
							const iceAuthKey = res.data.ice_auth_key;

							// target_user
							res = await routeTargetUser.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') return iceAuthKey;
									return null;
								},
								body: {
									user_id: user.document._id.toString()
								}
							}, null, db, config);
							assert.equal(res.message, null);

							// access_key
							res = await routeAccessKey.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') return iceAuthKey;
									return null;
								},
								body: {
									verification_code: authorizeRequest.document.verificationCode
								}
							}, null, db, config);

							assert.equal(res.message, null);
							assert(await ApplicationAccess.verifyKeyAsync(res.data.access_key, db, config));

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
