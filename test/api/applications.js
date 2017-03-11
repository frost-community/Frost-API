'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const route = require('../../built/routes/applications');
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

	describe('POST /applications', () => {
		afterEach(done => {
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
					let res = await route.post({
						user: {_id: '1234abcd'},
						application: {
							permissions: []
						},
						body: {
							name: 'hoge',
							description: 'hogehoge',
							permissions: []
						}
					}, null, config);

					assert.equal(res.statusCode, 200);

					var expectation = {
						application: {
							name: 'hoge',
							creatorId: '1234abcd',
							description: 'hogehoge',
							permissions: []
						}
					};
					delete res.data.application.id;
					assert.deepEqual(res.data, expectation);
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
					let res = await route.post({
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

					res = await route.post({
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
					let res = await route.post({
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

	describe('GET /applications/id', () => {
		it('正しくリクエストされた場合は成功する');
	});
	describe('POST /applications/id/application_key', () => {
		it('正しくリクエストされた場合は成功する');
	});
	describe('GET /applications/id/application_key', () => {
		it('正しくリクエストされた場合は成功する');
	});
});
