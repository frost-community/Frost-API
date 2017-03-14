'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const routeRequest = require('../../built/routes/ice_auth/request');
const routeVerificationKey = require('../../built/routes/ice_auth/verification_key');
const routeAuthorize = require('../../built/routes/ice_auth/authorize');
const dbConnector = require('../../built/helpers/dbConnector');

describe('API', () => {
	let dbManager;
	before(done => {
		(async () => {
			try {
				config.api.database = config.api.testDatabase;
				dbManager = await dbConnector.connectApidbAsync(config);

				done();
			}
			catch(e) {
				done(e);
			}
		})();
	});

	describe('/ice_auth', () => {
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

							assert.equal(res.statusCode, 200);

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

							assert.equal(res.statusCode, 200);

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

							assert.equal(res.statusCode, 200);

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