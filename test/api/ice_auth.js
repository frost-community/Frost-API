'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const route = require('../../built/routes/account');
const dbConnector = require('../../built/helpers/dbConnector')();

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

	describe('POST /ice_auth/request', () => {
		it('正しくリクエストされた場合は成功する');
	});

	describe('GET  /ice_auth/verification_key', () => {
		it('正しくリクエストされた場合は成功する');
	});

	describe('POST /ice_auth/authorize', () => {
		it('正しくリクエストされた場合は成功する');
	});
});