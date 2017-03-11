'use strict';

const assert = require('assert');
const config = require('../built/helpers/loadConfig')();

describe('General -', () => {
	describe('routes', () => {
		const routes = require('../built/routes')();

		it('存在するHTTPメソッドを利用している', () => {
			for(const route of routes) {
				let method = route[0];
				method = method.replace(/^del$/, 'delete');
				assert(require('methods').indexOf(method) > -1);
			}
		});

		it('権限リストにある権限名のみを利用している', () => {
			for(const route of routes) {
				if ('permissions' in route[2]) {
					for(const permission of route[2].permissions) {
						assert(require('../built/helpers/permission').permissionTypes.indexOf(permission) > -1);
					}
				}
			}
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
		const db = require('../built/helpers/dbConnector');
		let testDb;

		it('DBに接続してそのインスタンスが取得できる', (done) => {
			(async () => {
				try {
					testDb = await db.connectAsync(config.api.testDatabase.host, config.api.testDatabase.database);
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
