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
const AsyncLock = require('async-lock');


describe('User Storage API', () => {
	describe('/users/:id/storage', () => {
		// load collections
		let db, lock;
		before(done => {
			(async () => {
				try {
					config.api.database = config.api.testDatabase;

					const dbProvider = await DbProvider.connectApidbAsync(config);
					db = new Db(config, dbProvider);

					await db.users.removeAsync({});
					await db.applications.removeAsync({});

					lock = new AsyncLock();

					done();
				}
				catch (e) {
					done(e);
				}
			})();
		});

		// add general user, general application
		let user, app, base64TestData, testDataSize;
		beforeEach(done => {
			(async () => {
				try {
					user = await db.users.createAsync('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
					app = await db.applications.createAsync('generalapp', user, 'this is generalapp.', []);

					fs.readFile(path.resolve(__dirname, '../resources/kawaii.png'), 'base64', (err, data) => {
						if (err) {
							done(err);
						}
						base64TestData = data;
						testDataSize = Buffer.from(base64TestData, 'base64').length;
						done();
					});
				}
				catch (e) {
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
				catch (e) {
					done(e);
				}
			})();
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', done => {
				(async () => {
					const request = {
						body: {
							fileData: base64TestData
						},
						params: { id: user.document._id.toString() },
						user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
					};

					let resFiles = [];
					for (const i of require('../../built/helpers/enumRange')(0, 10)) {
						resFiles.push(await routeFiles.post(request));
					}

					const res = await route.get({
						params: { id: user.document._id.toString() },
						user: user, db: db, config: config, checkRequestAsync: () => null
					});

					const { spaceSize, usedSpace, availableSpace } = res.data.storage;
					assert.equal(testDataSize * resFiles.length, usedSpace, 'usedSpace is invalid value');
					assert.equal(spaceSize - testDataSize * resFiles.length, availableSpace, 'availableSpace is invalid value');

					done();
				})().catch(err => done(err));
			});
		});

		describe('/files', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する(1件、public)', done => {
					(async () => {
						let res = await routeFiles.post({
							body: {
								fileData: base64TestData
							},
							params: { id: user.document._id.toString() },
							user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
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
								type: 'image',
								size: testDataSize
							}
						}, res.data);
						done();
					})().catch(err => done(err));
				});

				// Disabled because heavy load
				/*it('非同期で一度に容量制限を超える量のドキュメントを作成した場合でも、容量制限が正常に動作し作成に失敗する(public)', async () => {
					const req = {
						body: {
							fileData: base64TestData
						},
						params: { id: user.document._id.toString() },
						user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
					};

					const promises = [];
					const count = parseInt(10 * 1024 * 1024 / testDataSize) + 1; // 49
					for (let i = 0; i < count; i++) {
						promises.push(routeFiles.post(req));
					}
					const resArray = await Promise.all(promises); // parseInt(10MB / testDataSize) + 1 > 10MB

					let failureCount = 0;
					for (const res of resArray) {
						if (res.data.storageFile != null) {
							assert(validator.isBase64(res.data.storageFile.fileData), 'returned fileData is not base64');
							delete res.data.storageFile.fileData;

							delete res.data.storageFile.id;
							delete res.data.storageFile.createdAt;

							assert.deepEqual({
								storageFile: {
									accessRight: { level: 'public' },
									creator: { type: 'user', id: user.document._id.toString() },
									mimeType: 'image/png',
									type: 'image',
									size: testDataSize
								}
							}, res.data);
						}
						else {
							failureCount++;
						}
					}

					assert(failureCount == 1, 'error respond: ' + failureCount);
				});*/

				it('fileDataが空のときは失敗する', done => {
					(async () => {
						let res = await routeFiles.post({
							body: {
								fileData: ''
							},
							params: { id: user.document._id.toString() },
							user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
						});

						assert.equal('file is not base64 format', res.data);

						done();
					})().catch(err => done(err));
				});
			});
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', done => {
					(async () => {
						const request = {
							body: {
								fileData: base64TestData
							},
							params: { id: user.document._id.toString() },
							user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
						};

						let resFiles = await Promise.all([
							routeFiles.post(request),
							routeFiles.post(request),
							routeFiles.post(request),
							routeFiles.post(request)
						]);

						let res = await routeFiles.get({
							params: {
								id: user.document._id.toString()
							},
							user: user, db: db, config: config, checkRequestAsync: () => null
						});

						assert(res.data.storageFiles != null, 'invalid response');
						assert(res.data.storageFiles.length == resFiles.length, 'invalid response length');

						for (const storageFile of res.data.storageFiles) {
							assert(validator.isBase64(storageFile.fileData), 'returned fileData is not base64');
							delete storageFile.fileData;

							delete storageFile.id;
							delete storageFile.createdAt;
							assert.deepEqual({
								accessRight: { level: 'public' },
								creator: { type: 'user', id: user.document._id.toString() },
								mimeType: 'image/png',
								type: 'image',
								size: testDataSize
							}, storageFile);
						}

						done();
					})().catch(err => done(err));
				});
			});

			describe('/:file_id', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', done => {
						(async () => {
							let resFile = await routeFiles.post({
								body: {
									fileData: base64TestData
								},
								params: { id: user.document._id.toString() },
								user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
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
									type: 'image',
									size: testDataSize
								}
							}, res.data);

							done();
						})().catch(err => done(err));
					});
				});
				describe('[DELETE]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
