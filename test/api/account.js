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

	describe('POST /account', () => {
		afterEach(done => {
			(async () => {
				try {
					await dbManager.removeAsync('users', {});

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
					let res = await route.post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					}, null, config);

					assert.equal(res.statusCode, 200);

					delete res.data.user.id;
					assert.deepEqual(res.data, {
						user: {
							screenName: 'hogehoge',
							name: 'froster',
							description: 'testhoge'
						}
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('screenNameが4文字未満もしくは16文字以上のとき失敗する', done => {
			(async () => {
				try {
					let res = await route.post({
						body: {
							screenName: 'abc',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					res = await route.post({
						body: {
							screenName: 'abcdefghijklmnop',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
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

		it('passwordが6文字未満のときは失敗する', done => {
			(async () => {
				try {
					let res = await route.post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c',
							name: 'froster',
							description: 'testhoge'
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

		it('nameが33文字以上のときは失敗する', done => {
			(async () => {
				try {
					let res = await route.post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: 'superFrostersuperFrostersuperFros',
							description: 'testhoge'
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
					let res = await route.post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: '',
							description: 'testhogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthogetesthoget'
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

	describe('GET  /account', () => {
		it('正しくリクエストされた場合は成功する'/*, done => {
			(async () => {
				try {
					let res = await route.get({user: {id: 'user_id_hoge'}}, null, config);

					assert.equal(res.statusCode, 200);

					delete res.data.user.id;
					assert.deepEqual(res.data, {
						user: {
							screenName: 'hogehoge',
							name: 'froster',
							description: 'testhoge'
						}
					});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		}*/);
	});
});
