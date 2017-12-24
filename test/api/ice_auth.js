const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const AuthorizeRequest = require('../../built/documentModels/authorizeRequest');
const ApplicationAccess = require('../../built/documentModels/applicationAccess');
const ApiContext = require('../../built/helpers/ApiContext');
const route = require('../../built/routes/ice_auth');
const routeVerificationCode = require('../../built/routes/ice_auth/verification_code');
const routeTargetUser = require('../../built/routes/ice_auth/target_user');
const routeAuthorize = require('../../built/routes/ice_auth/authorize');
const routeAuthorizeBasic = require('../../built/routes/ice_auth/authorize_basic');

describe('IceAuth API', () => {
	describe('/ice_auth', () => {
		// load collections
		let db;
		before(async () => {
			config.api.database = config.api.testDatabase;
			const dbProvider = await DbProvider.connectApidbAsync(config);
			db = new Db(config, dbProvider);

			await db.users.removeAsync({});
			await db.applications.removeAsync({});
			await db.authorizeRequests.removeAsync({});
			await db.applicationAccesses.removeAsync({});
		});

		// add general user, general application, general authorizeRequest
		let user, password, app, authorizeRequest;
		beforeEach(async () => {
			password = 'abcdefg';
			user = await db.users.createAsync('generaluser', password, 'froster', 'this is generaluser.');
			app = await db.applications.createAsync('generalapp', user, 'this is generalapp.', []);

			authorizeRequest = await db.authorizeRequests.createAsync({
				applicationId: app.document._id
			});
		});

		// remove all users, all applications
		afterEach(async () => {
			await db.users.removeAsync({});
			await db.applications.removeAsync({});
			await db.authorizeRequests.removeAsync({});
			await db.applicationAccesses.removeAsync({});
		});

		describe('[POST]', () => {
			it('正しくリクエストされた場合は成功する', async () => {
				const applicationKey = await app.generateApplicationKeyAsync();

				const context = new ApiContext(null, null, db, config, {
					body: {
						applicationKey: applicationKey
					},
					headers: { 'X-Api-Version': 1 },
					testMode: true
				});
				await route.post(context);

				assert(await AuthorizeRequest.verifyKeyAsync(context.data.iceAuthKey, db, config));
			});
		});

		describe('/verification_code', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					const iceAuthKey = await authorizeRequest.generateIceAuthKeyAsync();
					const verificationCode = await authorizeRequest.generateVerificationCodeAsync();

					const context = new ApiContext(null, null, db, config, {
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						testMode: true
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
							applicationKey: await app.generateApplicationKeyAsync()
						},
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					await route.post(context);
					assert.equal(typeof context.data, 'object');

					// targetUser
					context = new ApiContext(null, null, db, config, {
						body: {
							iceAuthKey: context.data.iceAuthKey,
							userId: user.document._id.toString()
						},
						headers: { 'X-Ice-Auth-Key': context.data.iceAuthKey, 'X-Api-Version': 1 },
						testMode: true
					});
					await routeTargetUser.post(context);
					assert.equal(typeof context.data, 'object');
				});
			});
		});

		describe('/authorize', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					// iceAuthKey
					let context = new ApiContext(null, null, db, config, {
						body: {
							applicationKey: await app.generateApplicationKeyAsync()
						},
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					await route.post(context);
					assert.equal(typeof context.data, 'object');

					const authorizeRequest = await db.authorizeRequests.findByIdAsync(AuthorizeRequest.splitKey(context.data.iceAuthKey, db, config).authorizeRequestId);
					const iceAuthKey = context.data.iceAuthKey;

					// targetUser
					context = new ApiContext(null, null, db, config, {
						body: {
							userId: user.document._id.toString()
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						testMode: true
					});
					await routeTargetUser.post(context);
					assert.equal(typeof context.data, 'object');

					// authorize
					context = new ApiContext(null, null, db, config, {
						body: {
							verificationCode: authorizeRequest.document.verificationCode
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						testMode: true
					});
					await routeAuthorize.post(context);
					assert(await ApplicationAccess.verifyKeyAsync(context.data.accessKey, db, config));
				});
			});
		});

		describe('/authorize_basic', () => {
			describe('[POST]', () => {
				it('正しくリクエストされた場合は成功する', async () => {
					// iceAuthKey
					let context = new ApiContext(null, null, db, config, {
						body: { applicationKey: await app.generateApplicationKeyAsync() },
						headers: { 'X-Api-Version': 1 },
						testMode: true
					});
					await route.post(context);
					assert.equal(typeof context.data, 'object');
					const iceAuthKey = context.data.iceAuthKey;

					context = new ApiContext(null, null, db, config, {
						body: {
							screenName: user.document.screenName,
							password: password
						},
						headers: { 'X-Ice-Auth-Key': iceAuthKey, 'X-Api-Version': 1 },
						testMode: true
					});
					await routeAuthorizeBasic.post(context);
					assert(await ApplicationAccess.verifyKeyAsync(context.data.accessKey, db, config));
				});
			});
		});
	});
});
