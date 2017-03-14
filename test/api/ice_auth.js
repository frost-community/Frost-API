'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const collections = require('../../built/helpers/collections');
const usersAsync = collections.users;
const applicationsAsync = collections.applications;
const routeRequest = require('../../built/routes/ice_auth/request');
const routeVerificationKey = require('../../built/routes/ice_auth/verification_key');
const routeAuthorize = require('../../built/routes/ice_auth/authorize');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
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

		// add general user, general application
		let user, app;
		beforeEach(done => {
			(async () => {
				try {
					let res = await users.createAsync({
						screenName: 'generaluser',
						password: 'abcdefg',
						name: 'froster',
						description: 'this is generaluser.'
					});
					user = res.document;

					res = await applications.createAsync({
						name: 'generalapp',
						description: 'this is generalapp.',
						permissions: []
					});
					app = res.document;

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
					await users.removeAsync({});
					await applications.removeAsync({});

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
							let res = await routeRequest.post({
								body: {
									application_key: 'application_key_hoge'
								}
							}, null, config);

							assert.equal(res.message, 'success');

							delete res.data.user.id;
							assert.deepEqual(res.data, {
								request_key: 'request_key_hoge'
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

		describe('/verification_key', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						try {
							let res = await routeVerificationKey.get({
								body: {
									application_key: 'application_key_hoge',
									request_key: 'request_key_hoge'
								}
							}, null, config);

							assert.equal(res.message, 'success');

							delete res.data.user.id;
							assert.deepEqual(res.data, {
								verification_key: 'verification_key_hoge'
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
									verification_key: 'verification_key_hoge'
								}
							}, null, config);

							assert.equal(res.message, 'success');

							delete res.data.user.id;
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
