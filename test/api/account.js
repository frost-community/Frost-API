'use strict';

const assert = require('assert');
const type = require('../../built/helpers/type');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const route = require('../../built/routes/account');


describe('Account API', () => {
	let db;
	before(done => {
		(async () => {
			try {
				config.api.database = config.api.testDatabase;

				const dbProvider = await DbProvider.connectApidbAsync(config);
				db = new Db(config, dbProvider);

				done();
			}
			catch(e) {
				done(e);
			}
		})();
	});

	describe('/account', () => {
		describe('[POST]', () => {
			afterEach(done => {
				(async () => {
					try {
						await db.users.removeAsync({});

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
							},
							db: db, config: config
						});

						delete res.data.user.id;
						delete res.data.user.createdAt;
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
							},
							db: db, config: config
						});
						assert.equal(res.data, 'screenName is invalid format');

						res = await route.post({
							body: {
								screenName: 'abcdefghijklmnop',
								password: 'a1b2c3d4e5f6g',
								name: 'froster',
								description: 'testhoge'
							},
							db: db, config: config
						});
						assert.equal(res.data, 'screenName is invalid format');

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
							},
							db: db, config: config
						});
						assert.equal(res.data, 'password is invalid format');

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
							},
							db: db, config: config
						});
						assert.equal(res.data, 'name is invalid format');

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
							},
							db: db, config: config
						});
						assert.equal(res.data, 'description is invalid format');

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
