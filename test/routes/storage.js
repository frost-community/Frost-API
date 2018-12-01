const assert = require('assert');
const $ = require('cafy').default;
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const apiStorageStatus = require('../../src/routes/storage/status');
const apiStorageFile = require('../../src/routes/storage/file');

describe('Storage endpoints', () => {

	/** @type {MongoAdapter} */
	let db;

	/** @type {UsersService} */
	let usersService;

	/** @type {ApplicationsService} */
	let applicationsService;

	// initialize for the test
	before(async () => {
		config.database = config.testDatabase;

		const authenticate = config.database.password != null ? `${config.database.username}:${config.database.password}` : config.database.username;
		db = await MongoAdapter.connect(config.database.host, config.database.database, authenticate);

		usersService = new UsersService(db, config);
		applicationsService = new ApplicationsService(db, config);
	});

	// initialize for the case
	let user, user2, app, authInfo;
	beforeEach(async () => {
		await db.remove('users', {});
		await db.remove('applications', {});
		await db.remove('authorizeRequests', {});
		await db.remove('applicationAccesses', {});

		user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
		user2 = await usersService.create('generaluser2', 'abcdefg', 'froster', 'this is generaluser2.');
		app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['app.read', 'app.create', 'app.host']);

		authInfo = { application: app, scopes: ['auth.read', 'app.create', 'app.host'] };
	});

	// filalize for the case
	afterEach(async () => {
	});

	// filalize for the test
	after(async () => {
	});

	function buildContext(params = {}) {
		return new ApiContext(db, config, {
			params,
			authInfo,
			user
		});
	}

	function expectsSuccess(ctx) {
		let err;
		assert.equal(ctx.responsed, true, 'no response');
		if (ctx.statusCode < 200 || ctx.statusCode >= 300) {
			throw new Error(`status code is not 2xx : ${ctx.statusCode} ${JSON.stringify(ctx.data)}`);
		}
		if (ctx.statusCode != 204) {
			err = $().object().test(ctx.data);
			if (err) throw err;
		}
	}

	function expectsFailure(ctx) {
		let err;
		assert.equal(ctx.responsed, true, 'no response');
		if (ctx.statusCode < 300 || ctx.statusCode >= 500) {
			throw new Error(`status code is not 4xx : ${ctx.statusCode} ${JSON.stringify(ctx.data)}`);
		}
	}

	describe('/storage/status/get', () => {
		it.skip('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiStorageStatus.get(ctx);
			expectsSuccess(ctx);
			const res = ctx.data;
			let err;

			console.log(res);
			//err = $().object().test(res.app);
			//if (err) throw err;
		});
	});

	describe('/storage/file/add', () => {
		it.skip('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiStorageFile.add(ctx);
			expectsSuccess(ctx);
			const res = ctx.data;
			let err;

			console.log(res);
			//err = $().object().test(res.app);
			//if (err) throw err;
		});
	});

	describe('/storage/file/get', () => {
		it.skip('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiStorageFile.get(ctx);
			expectsSuccess(ctx);
			const res = ctx.data;
			let err;

			console.log(res);
			//err = $().object().test(res.app);
			//if (err) throw err;
		});
	});

	describe('/storage/file/list', () => {
		it.skip('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiStorageFile.list(ctx);
			expectsSuccess(ctx);
			const res = ctx.data;
			let err;

			console.log(res);
			//err = $().object().test(res.app);
			//if (err) throw err;
		});
	});

	describe('/storage/file/delete', () => {
		it.skip('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiStorageFile.delete(ctx);
			expectsSuccess(ctx);
			const res = ctx.data;
			let err;

			console.log(res);
			//err = $().object().test(res.app);
			//if (err) throw err;
		});
	});
});
