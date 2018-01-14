const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');

describe('Posts API', () => {
	describe('/posts', () => {
		let db, usersService, applicationsService;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			db = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});
		});

		// add general user, general application
		let user, app;
		beforeEach(async () => {
			user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
			app = await applicationsService.create('generalapp', user, 'this is generalapp.', []);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('authorizeRequests', {});
			await db.remove('applicationAccesses', {});
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
