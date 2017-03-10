'use strict';

const assert = require('assert');
const config = require('../built/helpers/loadConfig')();

describe('API', () => {
	let dbManager;
	before(done => {
		(async () => {
			try {
				config.api.database = config.api.testDatabase;
				dbManager = await require('../built/helpers/dbConnector')().connectApidbAsync(config);
				done();
			}
			catch(e) {
				done(e);
			}
		})();
	});

	describe('アカウントを作成する時', () => {
		beforeEach(done => {
			(async () => {
				try {
					dbManager.removeAsync('users', {});
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
					const res = await require('../built/routes/account').post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					}, null, config);

					assert(res.statusCode == 200);
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});
});
