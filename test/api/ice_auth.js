const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
const ApplicationAccessesService = require('../../src/services/ApplicationAccessesService');
const AuthorizeRequestsService = require('../../src/services/AuthorizeRequestsService');
const ApiContext = require('../../src/modules/ApiContext');
const route = require('../../src/routes/ice_auth');
const routeVerificationCode = require('../../src/routes/ice_auth/verification_code');
const routeTargetUser = require('../../src/routes/ice_auth/target_user');
const routeAuthorize = require('../../src/routes/ice_auth/authorize');
const routeAuthorizeBasic = require('../../src/routes/ice_auth/authorize_basic');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
		let db, usersService, applicationsService, authorizeRequestsService;
		before(async () => {
			config.api.database = config.api.testDatabase;

			const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
			db = await MongoAdapter.connect(config.api.database.host, config.api.database.database, authenticate);

			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('applicationAccesses', {});
			await db.remove('authorizeRequests', {});

			usersService = new UsersService(db, config);
			applicationsService = new ApplicationsService(db, config);
			authorizeRequestsService = new AuthorizeRequestsService(db, config);
		});

		// add general user, general application, general authorizeRequest
		let user, password, app;
		beforeEach(async () => {
			password = 'abcdefg';
			user = await usersService.create('generaluser', password, 'froster', 'this is generaluser.');
			app = await applicationsService.create('generalapp', user, 'this is generalapp.', ['iceAuthHost']);
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.remove('users', {});
			await db.remove('applications', {});
			await db.remove('applicationAccesses', {});
			await db.remove('authorizeRequests', {});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const applicationKey = await applicationsService.generateApplicationKey(app);

				const context = new ApiContext(null, null, db, config, {
					body: {
						applicationKey: applicationKey
					},
					headers: { 'X-Api-Version': 1 },
					user,
					application: app
				});
				await route.post(context);
				assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);
				assert(await authorizeRequestsService.verifyIceAuthKey(context.data.iceAuthKey));
			});
		});

		describe('/verification_code', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const authorizeRequest = await authorizeRequestsService.create(app._id);

					const iceAuthKey = await authorizeRequestsService.generateIceAuthKey(authorizeRequest);
					const verificationCode = await authorizeRequestsService.generateVerificationCode(authorizeRequest);

					const context = new ApiContext(null, null, db, config, {
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeVerificationCode.get(context);
					assert.deepEqual(context.data, {
						verificationCode: verificationCode
					});
				});
			});
		});

		describe('/target_user', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					// iceAuthKey
					let context = new ApiContext(null, null, db, config, {
						body: {
							applicationKey: await applicationsService.generateApplicationKey(app)
						},
						headers: { 'X-Api-Version': 1 },
						user,
						application: app
					});
					await route.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);

					// targetUser
					context = new ApiContext(null, null, db, config, {
						body: {
							iceAuthKey: context.data.iceAuthKey,
							userId: user._id.toString()
						},
						headers: { 'X-Ice-Auth-Key': context.data.iceAuthKey, 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeTargetUser.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);
				});
			});
		});

		describe('/authorize', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					// iceAuthKey
					let context = new ApiContext(null, null, db, config, {
						body: {
							applicationKey: await applicationsService.generateApplicationKey(app)
						},
						headers: { 'X-Api-Version': 1 },
						user,
						application: app
					});
					await route.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);

					const authorizeRequest = await db.findById('authorizeRequests', authorizeRequestsService.splitIceAuthKey(context.data.iceAuthKey).authorizeRequestId);
					const iceAuthKey = context.data.iceAuthKey;

					// targetUser
					context = new ApiContext(null, null, db, config, {
						body: {
							userId: user._id.toString()
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeTargetUser.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);

					// authorize
					context = new ApiContext(null, null, db, config, {
						body: {
							verificationCode: authorizeRequest.verificationCode
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeAuthorize.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);
					assert(/([^-]+)-([^-]{64}).([0-9]+)/.test(iceAuthKey), 'invalid IceAuthKey');
				});
			});
		});

		describe('/authorize_basic', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					// iceAuthKey
					let context = new ApiContext(null, null, db, config, {
						body: { applicationKey: await applicationsService.generateApplicationKey(app) },
						headers: { 'X-Api-Version': 1 },
						user,
						application: app
					});
					await route.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);

					const iceAuthKey = context.data.iceAuthKey;

					context = new ApiContext(null, null, db, config, {
						body: {
							screenName: user.screenName,
							password: password
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						user,
						application: app
					});
					await routeAuthorizeBasic.post(context);
					assert(context.data != null && typeof context.data != 'string', `api error: ${context.data}`);
					assert(/([^-]+)-([^-]{64}).([0-9]+)/.test(iceAuthKey), 'invalid IceAuthKey');
				});
			});
		});
	});
});
