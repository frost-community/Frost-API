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

	describe('POST /account - アカウントを作成する', () => {
		beforeEach(done => {
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
					let res = await require('../built/routes/account').post({
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					}, null, config);
					assert.equal(res.statusCode, 200);

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
					let res = await require('../built/routes/account').post({
						body: {
							screenName: 'abc',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					res = await require('../built/routes/account').post({
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
					let res = await require('../built/routes/account').post({
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
					let res = await require('../built/routes/account').post({
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
					let res = await require('../built/routes/account').post({
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

	describe('POST /applications - アプリケーションを作成する', () => {
		beforeEach(done => {
			(async () => {
				try {
					await dbManager.removeAsync('applications', {});

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
					let res = await require('../built/routes/applications').post({
						user: {_id: ''},
						application: {
							permissions: []
						},
						body: {
							name: 'hoge',
							description: 'hogehoge',
							permissions: ''
						}
					}, null, config);
					assert.equal(res.statusCode, 200);

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
					let res = await require('../built/routes/applications').post({
						user: {_id: ''},
						application: {
							permissions: []
						},
						body: {
							name: '',
							description: 'hogehoge',
							permissions: ''
						}
					}, null, config);
					assert.equal(res.statusCode, 400);

					res = await require('../built/routes/applications').post({
						user: {_id: ''},
						application: {
							permissions: []
						},
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
					let res = await require('../built/routes/applications').post({
						user: {_id: ''},
						application: {
							permissions: []
						},
						body: {
							name: 'hoge',
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
});
