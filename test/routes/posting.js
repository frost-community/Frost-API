const assert = require('assert');
const $ = require('cafy').default;
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApiContext = require('../../src/modules/ApiContext');
const apiPosting = require('../../src/routes/posting');
const apiPostingTimelineHome = require('../../src/routes/posting/timeline/home');
const apiPostingTimelineUser = require('../../src/routes/posting/timeline/user');

describe('Posting endpoints', () => {

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
		app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['post.write']);

		authInfo = { application: app, scopes: ['user.read', 'post.read', 'post.write'] };
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

	describe('/posting/create-chat', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({ text: 'abc' });
			await apiPosting['create-chat'](ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.posting);
			if (err) throw err;
		});
	});

	describe('/posting/create-article', () => {
		it('if request is valid');
	});

	describe('/posting/create-reference', () => {
		it('if request is valid');
	});

	describe('/posting/get', () => {
		it('if request is valid', async () => {
			const ctx1 = buildContext({ text: 'abc' });
			await apiPosting['create-chat'](ctx1);
			testSuccess(ctx1);
			const posting = ctx1.data.posting;

			const ctx = buildContext({ postingId: posting.id });
			await apiPosting.get(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().object().test(res.posting);
			if (err) throw err;
		});
	});

	describe('/posting/timeline/home', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({ });
			await apiPostingTimelineHome.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().array().test(res.postings);
			if (err) throw err;
			err = $().nullable.string().test(res.newer);
			if (err) throw err;
			err = $().nullable.string().test(res.older);
			if (err) throw err;
		});
	});

	describe('/posting/timeline/user', () => {
		it('if request is valid', async () => {
			const ctx = buildContext({ userId: MongoAdapter.stringifyId(user._id) });
			await apiPostingTimelineUser.list(ctx);
			testSuccess(ctx);
			const res = ctx.data;
			let err;

			err = $().array().test(res.postings);
			if (err) throw err;
			err = $().nullable.string().test(res.newer);
			if (err) throw err;
			err = $().nullable.string().test(res.older);
			if (err) throw err;
		});
	});
});
