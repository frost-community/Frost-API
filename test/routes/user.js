const assert = require('assert');
const $ = require('cafy').default;
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const apiUser = require('../../src/routes/user');
const apiUserRelation = require('../../src/routes/user/relation');
const apiUserFollowing = require('../../src/routes/user/following');
const apiUserFollower = require('../../src/routes/user/follower');

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
		app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['user.read', 'user.create']);

		authInfo = { application: app, scopes: ['user.write', 'user.read', 'user.create'] };
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
		if (ctx.statusCode < 200 || ctx.statusCode >= 300) {
			throw new Error(`status code is not 2xx : ${ctx.statusCode} ${JSON.stringify(ctx.data)}`);
		}
		if (ctx.statusCode != 204) {
			err = $().object().test(ctx.data);
			if (err) throw err;
		}
	}

	describe('/user/create', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({ screenName: 'tempUser1', password: 'temp1234' });
			await apiUser.create(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.user);
			if (err) throw err;
		});
	});

	describe('/user/list', () => {
		it('if request is valid', async () => {
			const ctx = buildContext();
			await apiUser.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().array($().object()).min(1).test(res.users);
			if (err) throw err;
		});
	});

	describe('/user/get', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({ userId: MongoAdapter.stringifyId(user._id) });
			await apiUser.get(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.user);
			if (err) throw err;
		});
	});

	describe('/user/update', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({
			});
			await apiUser.update(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.user);
			if (err) throw err;
		});
	});

	describe('/user/follow', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({
				targetUserId: MongoAdapter.stringifyId(user2._id)
			});
			await apiUser.follow(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().boolean().test(res.following);
			if (err) throw err;
		});
	});

	describe('/user/unfollow', () => {
		it('if request is valid', async () => {
			await apiUser.follow(buildContext({
				targetUserId: MongoAdapter.stringifyId(user2._id)
			}));

			const ctx = buildContext({
				targetUserId: MongoAdapter.stringifyId(user2._id)
			});
			await apiUser.unfollow(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().boolean().test(res.following);
			if (err) throw err;
		});
	});

	describe('/user/relation/get', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({
				sourceUserId: MongoAdapter.stringifyId(user._id),
				targetUserId: MongoAdapter.stringifyId(user2._id),
			});
			await apiUserRelation.get(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().boolean().test(res.following);
			if (err) throw err;
		});
	});

	describe('/user/following/list', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({
				userId: MongoAdapter.stringifyId(user._id)
			});
			await apiUserFollowing.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;
		});
	});

	describe('/user/follower/list', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({
				userId: MongoAdapter.stringifyId(user._id)
			});
			await apiUserFollower.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;
		});
	});
});
