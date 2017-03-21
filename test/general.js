'use strict';

const assert = require('assert');
const config = require('../built/helpers/loadConfig')();
const DirectoryRouter = require('../built/helpers/directoryRouter');

describe('General -', () => {
	describe('routes', () => {
		const routeList = require('../built/routeList')();

		it('存在するHTTPメソッドを利用している', () => {
			for(const route of routeList) {
				let method = route[0];
				method = method.replace(/^del$/, 'delete');
				assert(require('methods').indexOf(method) > -1);
			}
		});

		it('権限リストにある権限名のみを利用している', () => {
			for(const route of routeList) {
				if ('permissions' in route[2]) {
					for(const permission of route[2].permissions) {
						assert(require('../built/helpers/permission').permissionTypes.indexOf(permission) != -1);
					}
				}
			}
		});

		it('すべての対象ルートのモジュールが存在している', () => {
			let errorCount = 0;
			routeList.forEach(route => {
				let module;
				try {
					module = require(DirectoryRouter.getRouteMoludePath(route[1]));
				}
				catch(e) {
					module = null;
				}

				if (module == null) {
					console.log(`route module not found: ${route[1]}`);
					errorCount++;
				}
			});
			assert.equal(errorCount, 0);
		});
	});

	describe('randomRange', () => {
		const random = require('../built/helpers/randomRange');

		it('範囲を指定して生成した乱数の値はその範囲内にある', () => {
			for(let i = 0; i < 1000; i++) {
				const value = random(64, 1024);
				assert(value >= 64 && value <= 1024);
			}
		});
	});

	describe('database', () => {
		const DbProvider = require('../built/helpers/dbProvider');
		let testDb;

		it('DBに接続してそのインスタンスが取得できる', (done) => {
			(async () => {
				try {
					const host = config.api.testDatabase.port != null ? `${config.api.testDatabase.host}:${config.api.testDatabase.port}` : config.api.testDatabase.host;
					const authenticate = config.api.testDatabase.password != null ? `${config.api.testDatabase.username}:${config.api.testDatabase.password}` : config.api.testDatabase.username;
					testDb = await DbProvider.connectAsync(host, config.api.testDatabase.database, authenticate);
					assert(testDb != null);
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('DBのコレクションにドキュメントを作成できる', (done) => {
			(async () => {
				try {
					assert(testDb != null);
					const document = await testDb.createAsync('hoges', {piyo: 'fuga', nyao: 'nya'});
					assert(document != null);
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('DBのコレクションからドキュメントを取り出すことができる', (done) => {
			(async () => {
				try {
					assert(testDb != null);
					const document = await testDb.findAsync('hoges', {piyo: 'fuga'});
					assert('nyao' in document && document.nyao === 'nya');
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		it('DBのコレクションからドキュメントを削除することができる', (done) => {
			(async () => {
				try {
					assert(testDb != null);
					await testDb.removeAsync('hoges', {piyo: 'fuga'});
					assert((await testDb.findArrayAsync('hoges', {piyo: 'fuga'})).length === 0);
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});
});
