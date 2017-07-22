'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');

describe('Posts API', () => {
	describe('/posts', () => {
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
					await db.authorizeRequests.removeAsync({});
					await db.applicationAccesses.removeAsync({});

					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});

		describe('/:id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
		describe('/post_status', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
		describe('/post_article', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
		describe('/post_reference', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
	});
});
