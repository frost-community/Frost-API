'use strict';

const assert = require('assert');
const config = require('../built/helpers/loadConfig')();
const Route = require('../built/helpers/route');

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

		it('すべての対象ルートのモジュールが存在している', () => {
			let errorCount = 0;
			routeList.forEach(route => {
				const routeInstance = new Route(route[0], route[1]);
				let module;

				try {
					module = require(routeInstance.getModulePath())[routeInstance.method];
				}
				catch(e) {
					module = null;
				}

				if (module == null) {
					console.log(`route module not found: ${route[0]} ${route[1]}`);
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
					const authenticate = config.api.testDatabase.password != null ? `${config.api.testDatabase.username}:${config.api.testDatabase.password}` : config.api.testDatabase.username;
					testDb = await DbProvider.connectAsync(config.api.testDatabase.host, config.api.testDatabase.database, authenticate);
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
