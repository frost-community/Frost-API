const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const path = require('path');
const validator = require('validator');
const AsyncLock = require('async-lock');
const { getFileDataAsync } = require('../../built/helpers/fileSystemHelpers');
const route = require('../../built/routes/users/id/storage');
const routeFiles = require('../../built/routes/users/id/storage/files');
const routeFileId = require('../../built/routes/users/id/storage/files/file_id');

describe('User Storage API', () => {
	describe('/users/:id/storage', () => {
		// load collections
		let db, lock;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const dbProvider = await DbProvider.connectApidbAsync(config);
			db = new Db(config, dbProvider);

			await db.users.removeAsync({});
			await db.applications.removeAsync({});

			lock = new AsyncLock();

			config.api.storage.spaceSize = 500 * 1024; // テスト用の容量(500KB)に設定
		});

		// add general user, general application
		let user, app, testData64, testData64Size;
		beforeEach(async () => {
			user = await db.users.createAsync('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			app = await db.applications.createAsync('generalapp', user, 'this is generalapp.', []);

			testData64 = await getFileDataAsync(path.resolve(__dirname, '../resources/squid.png'), 'base64');
			testData64Size = Buffer.from(testData64, 'base64').length;
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
			await db.storageFiles.removeAsync({});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const request = {
					body: {
						fileData: testData64
					},
					params: { id: user.document._id.toString() },
					user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
				};

				let resFiles = [];
				for (let i = 0; i < 4; i++) {
					resFiles.push(await routeFiles.post(request));
				}

				const res = await route.get({
					params: { id: user.document._id.toString() },
					user: user, db: db, config: config, checkRequestAsync: () => null
				});

				const { spaceSize, usedSpace, availableSpace } = res.data.storage;
				assert.equal(testData64Size * resFiles.length, usedSpace, 'usedSpace is invalid value');
				assert.equal(spaceSize - testData64Size * resFiles.length, availableSpace, 'availableSpace is invalid value');
			});
		});

		describe('/files', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する(1件、public)', async () => {
					let res = await routeFiles.post({
						body: {
							fileData: testData64
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
							size: testData64Size
						}
					}, res.data);
				});

				it('非同期で一度に容量制限を超える量のドキュメントを作成した場合でも、容量制限が正常に動作し作成に失敗する(public)', async () => {
					const req = {
						body: {
							fileData: testData64
						},
						params: { id: user.document._id.toString() },
						user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
					};

					const promises = [];
					const count = parseInt(config.api.storage.spaceSize / testData64Size) + 1; // parseInt(500KB / 53.8KB) + 1 = 10 items, 10 * 53.8KB > 500KB
					for (let i = 0; i < count; i++) {
						promises.push(routeFiles.post(req));
					}
					const resArray = await Promise.all(promises);

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
									size: testData64Size
								}
							}, res.data);
						}
						else {
							failureCount++;
						}
					}

					assert(failureCount == 1, 'error respond: ' + failureCount);
				});

				it('fileDataが空のときは失敗する', async () => {
					let res = await routeFiles.post({
						body: {
							fileData: ''
						},
						params: { id: user.document._id.toString() },
						user: user, db: db, config: config, lock: lock, checkRequestAsync: () => null
					});

					assert.equal('file is not base64 format', res.data);
				});
			});
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const request = {
						body: {
							fileData: testData64
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
							size: testData64Size
						}, storageFile);
					}
				});
			});

			describe('/:file_id', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する', async () => {
						let resFile = await routeFiles.post({
							body: {
								fileData: testData64
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
								size: testData64Size
							}
						}, res.data);
					});
				});
				describe('[DELETE]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
