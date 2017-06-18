'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const crypto = require('crypto');
const randomRange = require('../../built/helpers/randomRange');
const AuthorizeRequest = require('../../built/documentModels/authorizeRequest');
const ApplicationAccess = require('../../built/documentModels/applicationAccess');
const route = require('../../built/routes/ice_auth');
const routeVerificationCode = require('../../built/routes/ice_auth/verification_code');
const routeTargetUser = require('../../built/routes/ice_auth/target_user');
const routeAuthorize = require('../../built/routes/ice_auth/authorize');
const routeAuthorizeBasic = require('../../built/routes/ice_auth/authorize_basic');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
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

		// add general user, general application, general authorizeRequest
		let user, password, app, authorizeRequest;
		beforeEach(done => {
			(async () => {
				try {
					password = 'abcdefg';

					const salt = randomRange(1, 99999);
					const sha256 = crypto.createHash('sha256');
					sha256.update(`${password}.${salt}`);
					const hash = `${sha256.digest('hex')}.${salt}`;

					user = await db.users.createAsync({
						screenName: 'generaluser',
						passwordHash: hash,
						name: 'froster',
						description: 'this is generaluser.'
					});

					app = await db.applications.createAsync({
						creatorId: user.document._id,
						name: 'generalapp',
						description: 'this is generalapp.',
						permissions: []
					});

					authorizeRequest = await db.authorizeRequests.createAsync({
						applicationId: app.document._id
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

						const res = await route.post({
							body: {
								applicationKey: applicationKey
							},
							db: db, config: config, checkRequestAsync: () => null
						});

						assert(await AuthorizeRequest.verifyKeyAsync(res.data.iceAuthKey, db, config));

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
							const iceAuthKey = await authorizeRequest.generateIceAuthKeyAsync();
							const verificationCode = await authorizeRequest.generateVerificationCodeAsync();

							const res = await routeVerificationCode.get({
								get: (h) => { /* headers */
									if (h == 'X-Ice-Auth-Key') {
										return iceAuthKey;
									}

									return null;
								},
								db: db, config: config, checkRequestAsync: () => null
							});

							assert.deepEqual(res.data, {
								verificationCode: verificationCode
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

		describe('/target_user', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							// iceAuthKey
							let res = await route.post({
								body: {
									applicationKey: await app.generateApplicationKeyAsync()
								},
								db: db, config: config, checkRequestAsync: () => null
							});
							assert.equal(typeof res.data, 'object');

							// targetUser
							res = await routeTargetUser.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') {
										return res.data.iceAuthKey;
									}

									return null;
								},
								body: {
									iceAuthKey: res.data.iceAuthKey,
									userId: user.document._id.toString()
								},
								db: db, config: config, checkRequestAsync: () => null
							});
							assert.equal(typeof res.data, 'object');

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
							// iceAuthKey
							let res = await route.post({
								body: {
									applicationKey: await app.generateApplicationKeyAsync()
								},
								db: db, config: config, checkRequestAsync: () => null
							});
							assert.equal(typeof res.data, 'object');

							const authorizeRequest = await db.authorizeRequests.findByIdAsync(AuthorizeRequest.splitKey(res.data.iceAuthKey, db, config).authorizeRequestId);
							const iceAuthKey = res.data.iceAuthKey;

							// targetUser
							res = await routeTargetUser.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') {
										return iceAuthKey;
									}

									return null;
								},
								body: {
									userId: user.document._id.toString()
								},
								db: db, config: config, checkRequestAsync: () => null
							});
							assert.equal(typeof res.data, 'object');

							// authorize
							res = await routeAuthorize.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') {
										return iceAuthKey;
									}

									return null;
								},
								body: {
									verificationCode: authorizeRequest.document.verificationCode
								},
								db: db, config: config, checkRequestAsync: () => null
							});

							assert(await ApplicationAccess.verifyKeyAsync(res.data.accessKey, db, config));

							done();
						}
						catch(e) {
							done(e);
						}
					})();
				});
			});
		});

		describe('/authorize_basic', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							// iceAuthKey
							let res = await route.post({
								body: {
									applicationKey: await app.generateApplicationKeyAsync()
								},
								db: db, config: config, checkRequestAsync: () => null
							});
							assert.equal(typeof res.data, 'object');

							const iceAuthKey = res.data.iceAuthKey;

							res = await routeAuthorizeBasic.post({
								get: (h) => {
									if (h == 'X-Ice-Auth-Key') {
										return iceAuthKey;
									}

									return null;
								},
								body: {
									screenName: user.document.screenName,
									password: password
								},
								db: db, config: config, checkRequestAsync: () => null
							});

							assert(await ApplicationAccess.verifyKeyAsync(res.data.accessKey, db, config));

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
