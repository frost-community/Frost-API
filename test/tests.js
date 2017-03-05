'use strict';

const assert = require('assert');
const config = require('../built/helpers/loadConfig')();

describe('dbManager', () => {
	const db = require('../built/helpers/dbConnector')();
	let testDb;
	it('DBに接続してそのインスタンスが取得できる', (done) => {
		(async () => {
			try {
				testDb = await db.connectAsync(config.api.database.host, config.api.database.port, 'test');
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
