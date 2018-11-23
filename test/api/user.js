const assert = require('assert');
const $ = require('cafy').default;
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const userApi = require('../../src/routes/user');

describe('User endpoints', () => {

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

		await db.remove('users', {});
		await db.remove('applications', {});
		await db.remove('authorizeRequests', {});
		await db.remove('applicationAccesses', {});

		usersService = new UsersService(db, config);
		applicationsService = new ApplicationsService(db, config);
	});

	// initialize for the case
	let user, user2, app, authInfo, ctx;
	beforeEach(async () => {
		user = await usersService.create('generaluser', 'abcdefg', 'froster', 'this is generaluser.');
		user2 = await usersService.create('generaluser2', 'abcdefg', 'froster', 'this is generaluser2.');
		app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['user.read', 'user.create']);

		authInfo = { application: app, scopes: ['user.read', 'user.create'] };
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

	function testSuccess(ctx) {
		let err;
		assert.equal(ctx.responsed, true, 'no response');
		if (ctx.statusCode != 200) {
			throw new Error(`status code is not 200: ${ctx.data.message}`);
		}
		err = $().object().test(ctx.data);
		if (err) throw err;
	}

	describe('/user/create', () => {
		it('if valid request', async () => {
			const ctx = buildContext({ screenName: 'tempUser1', password: 'temp1234' });
			await userApi.create(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.user);
			if (err) throw err;
		});
	});

	describe('/user/list', () => {
		it('if valid request', async () => {
			const ctx = buildContext();
			await userApi.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().array($().object()).min(1).test(res.users);
			if (err) throw err;
		});
	});

	describe('/user/get', () => {
		it('if valid request', async () => {
			const ctx = buildContext({ userId: MongoAdapter.stringifyId(user._id) });
			await userApi.get(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.user);
			if (err) throw err;
		});
	});

	describe('/user/update', () => {
		it('if valid request');
	});

	describe('/user/follow', () => {
		it('if valid request');
	});

	describe('/user/unfollow', () => {
		it('if valid request');
	});

	describe('/user/relation/get', () => {
		it('if valid request');
	});

	describe('/user/following/list', () => {
		it('if valid request');
	});

	describe('/user/follower/list', () => {
		it('if valid request');
	});
});
