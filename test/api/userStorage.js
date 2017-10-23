'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const path = require('path');
const fs = require('fs');
const validator = require('validator');
const route = require('../../built/routes/users/id/storage');
const routeFiles = require('../../built/routes/users/id/storage/files');
const routeFileId = require('../../built/routes/users/id/storage/files/file_id');

describe('User Storage API', () => {
	describe('/users/:user_id/storage', () => {
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

		// add general user, general application
		let user, app;
		beforeEach(done => {
			(async () => {
				try {
					user = await db.users.createAsync('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
					app = await db.applications.createAsync('generalapp', user, 'this is generalapp.', []);

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

					await db.storageFiles.removeAsync({});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する');
		});

		describe('/files', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する(public)', done => {
					fs.readFile(path.resolve('./logo.png'), 'base64', (err, data) => {
						(async () => {
							if (err)
								return done(err);

							let res = await routeFiles.post({
								body: {
									fileData: data
								},
								user: user, db: db, config: config, checkRequestAsync: () => null
							});

							assert(validator.isBase64(res.data.storageFile.fileData), 'returned fileData is not base64');
							delete res.data.storageFile.fileData;

							delete res.data.storageFile.id;
							delete res.data.storageFile.createdAt;

							assert.deepEqual({
								storageFile: {
									accessRight: { level: 'public' },
									creator: { type: 'user', id: user.document._id.toString() },
									mimeType: 'image/png',
									type: 'image'
								}
							}, res.data);
							done();
						})()
						.catch(err => done(err));
					});
				});

				it('fileDataが空のときは失敗する', done => {
					(async () => {
						let res = await routeFiles.post({
							body: {
								fileData: ''
							},
							user: user, db: db, config: config, checkRequestAsync: () => null
						});

						assert.equal('file is not base64 format', res.data);
						done();
					})()
					.catch(err => done(err));
				});
			});
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});

			describe('/:file_id', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', done => {
						fs.readFile(path.resolve('./logo.png'), 'base64', (err, data) => {
							(async () => {
								if (err)
									return done(err);

								let resFile = await routeFiles.post({
									body: {
										fileData: data
									},
									user: user, db: db, config: config, checkRequestAsync: () => null
								});

								let res = await routeFileId.get({
									params: {
										id: user.document._id.toString(),
										'file_id': resFile.data.storageFile.id
									},
									user: user, db: db, config: config, checkRequestAsync: () => null
								});

								assert(validator.isBase64(res.data.storageFile.fileData), 'returned fileData is not base64');
								delete res.data.storageFile.fileData;

								delete res.data.storageFile.id;
								delete res.data.storageFile.createdAt;
								assert.deepEqual({
									storageFile: {
										accessRight: { level: 'public' },
										creator: { type: 'user', id: user.document._id.toString() },
										mimeType: 'image/png',
										type: 'image'
									}
								}, res.data);
								done();
							})()
							.catch(err => done(err));
						});
					});
				});
				describe('[DELETE]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
