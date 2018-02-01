const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const path = require('path');
const validator = require('validator');
const AsyncLock = require('async-lock');
const { getFileData } = require('../../src/modules/helpers/FileSystemHelper');
const ApiContext = require('../../src/modules/ApiContext');
const route = require('../../src/routes/users/id/storage');
const routeFiles = require('../../src/routes/users/id/storage/files');
const routeFileId = require('../../src/routes/users/id/storage/files/file_id');

describe('User Storage API', () => {
	describe('/users/:id/storage', () => {
		// load collections
		let db, usersService, applicationsService, lock, testData64, testData64Size;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			db = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('storageFiles', {});

			usersService = new UsersService(db, config);
			applicationsService = new ApplicationsService(db, config);

			lock = new AsyncLock();

			config.api.storage.spaceSize = 500 * 1024; // テスト用の容量(500KB)に設定

			testData64 = await getFileData(path.resolve(__dirname, '../resources/squid.png'), 'base64');
			testData64Size = Buffer.from(testData64, 'base64').length;
		});

		// add general user, general application
		let user, app;
		beforeEach(async () => {
			user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['storageRead', 'storageWrite']);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('storageFiles', {});
		});

		describe('[GET]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				let context;
				const fileApiContexts = [];
				const promises = [];
				for (let i = 0; i < 4; i++) {
					context = new ApiContext(null, lock, db, config, {
						params: { id: user._id.toString() },
						body: { fileData: testData64 },
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					context.application = app;
					context.user = user;
					fileApiContexts.push(context);
					promises.push(routeFiles.post(context));
				}
				await Promise.all(promises);

				context = new ApiContext(null, lock, db, config, {
					params: { id: user._id.toString() },
					headers: { 'X-Api-Version': 1 },
					testMode: true
				});
				context.application = app;
				context.user = user;
				await route.get(context);

				assert(typeof context.data != 'string', `api error: ${context.data}`);

				const { spaceSize, usedSpace, availableSpace } = context.data.storage;
				assert.equal(testData64Size * fileApiContexts.length, usedSpace, 'usedSpace is invalid value');
				assert.equal(spaceSize - testData64Size * fileApiContexts.length, availableSpace, 'availableSpace is invalid value');
			});
		});

		describe('/files', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する(1件、public)', async () => {
					const context = new ApiContext(null, lock, db, config, {
						params: { id: user._id.toString() },
						body: { fileData: testData64 },
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					context.application = app;
					context.user = user;
					await routeFiles.post(context);

					assert(typeof context.data != 'string', `api error: ${context.data}`);

					assert(validator.isBase64(context.data.storageFile.fileData), 'returned fileData is not base64');
					delete context.data.storageFile.fileData;

					delete context.data.storageFile.id;
					delete context.data.storageFile.createdAt;

					assert.deepEqual({
						storageFile: {
							accessRight: { level: 'public' },
							creator: { type: 'user', id: user._id.toString() },
							mimeType: 'image/png',
							type: 'image',
							size: testData64Size
						}
					}, context.data);
				});

				it('非同期で一度に容量制限を超える量のドキュメントを作成した場合でも、容量制限が正常に動作し作成に失敗する(public)', async () => {
					const contexts = [];
					const promises = [];
					const count = parseInt(config.api.storage.spaceSize / testData64Size) + 1; // parseInt(500KB / 53.8KB) + 1 = 10 items, 10 * 53.8KB > 500KB
					for (let i = 0; i < count; i++) {
						const context = new ApiContext(null, lock, db, config, {
							params: { id: user._id.toString() },
							body: { fileData: testData64 },
							headers: { 'X-Api-Version': 1 },
							user,
							application: app
						});
						contexts.push(context);
						promises.push(routeFiles.post(context));
					}
					await Promise.all(promises);

					let failureCount = 0;
					for (const context of contexts) {
						if (context.responsed && context.data.storageFile != null) {
							assert(validator.isBase64(context.data.storageFile.fileData), 'returned fileData is not base64');
							delete context.data.storageFile.fileData;
							delete context.data.storageFile.id;
							delete context.data.storageFile.createdAt;

							assert.deepEqual({
								storageFile: {
									accessRight: { level: 'public' },
									creator: { type: 'user', id: user._id.toString() },
									mimeType: 'image/png',
									type: 'image',
									size: testData64Size
								}
							}, context.data);
						}
						else {
							failureCount++;
						}
					}
					assert(failureCount == 1, 'invalid failureCount: ' + failureCount);
				});

				it('fileDataが空のときは失敗する', async () => {
					const context = new ApiContext(null, lock, db, config, {
						params: { id: user._id.toString() },
						body: { fileData: '' },
						headers: { 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeFiles.post(context);

					assert.equal('body parameter \'fileData\' is invalid', context.data);
				});

			});
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					let context;
					const contexts = [];
					for (let i = 0; i < 4; i++) {
						context = new ApiContext(null, lock, db, config, {
							params: { id: user._id.toString() },
							body: { fileData: testData64 },
							headers: { 'X-Api-Version': 1 },
							user,
							application: app
						});
						contexts.push(context);
					}
					await Promise.all(contexts.map(c => routeFiles.post(c)));

					context = new ApiContext(null, lock, db, config, {
						params: { id: user._id.toString() },
						headers: { 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeFiles.get(context);

					assert(typeof context.data != 'string', `api error: ${context.data}`);

					assert(context.data.storageFiles != null, 'invalid response');
					assert.equal(context.data.storageFiles.length, contexts.length, 'invalid response length');

					for (const storageFile of context.data.storageFiles) {
						delete storageFile.id;
						delete storageFile.createdAt;
						assert.deepEqual({
							accessRight: { level: 'public' },
							creator: { type: 'user', id: user._id.toString() },
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
						const contextFile = new ApiContext(null, lock, db, config, {
							params: { id: user._id.toString() },
							body: { fileData: testData64 },
							headers: { 'X-Api-Version': 1 },
							user,
							application: app
						});
						await routeFiles.post(contextFile);

						assert(typeof contextFile.data != 'string', `api error: ${contextFile.data}`);

						const context = new ApiContext(null, lock, db, config, {
							params: {
								id: user._id.toString(),
								'file_id': contextFile.data.storageFile.id
							},
							headers: { 'X-Api-Version': 1 },
							user,
							application: app
						});
						await routeFileId.get(context);

						assert(typeof context.data != 'string', `api error: ${context.data}`);

						assert(validator.isBase64(context.data.storageFile.fileData), 'returned fileData is not base64');
						delete context.data.storageFile.fileData;
						delete context.data.storageFile.id;
						delete context.data.storageFile.createdAt;
						assert.deepEqual({
							storageFile: {
								accessRight: { level: 'public' },
								creator: { type: 'user', id: user._id.toString() },
								mimeType: 'image/png',
								type: 'image',
								size: testData64Size
							}
						}, context.data);
					});
				});
				describe('[DELETE]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
