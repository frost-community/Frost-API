const UsersService = require('../services/UsersService');
const UserFollowingsService = require('../services/UserFollowingsService');
const ApplicationsService = require('../services/ApplicationsService');
const AuthorizeRequestsService = require('../services/AuthorizeRequestsService');
const ApplicationAccessesService = require('../services/ApplicationAccessesService');
const PostsService = require('../services/PostsService');
const StorageFilesService = require('../services/StorageFilesService');
const { InvalidOperationError } = require('./errors');
const MongoAdapter = require('./MongoAdapter');

class ApiContext {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(streams, lock, repository, config, options) {
		this.lock = lock;
		this.streams = streams;
		this.repository = repository;
		this.config = config;
		options = options || {};
		this.params = options.params || {};
		this.query = options.query || {};
		this.body = options.body || {};
		this.user = options.user;
		this.application = options.application;
		// service instances
		this.usersService = new UsersService(repository, config);
		this.userFollowingsService = new UserFollowingsService(repository, config);
		this.applicationsService = new ApplicationsService(repository, config);
		this.authorizeRequestsService = new AuthorizeRequestsService(repository, config);
		this.applicationAccessesService = new ApplicationAccessesService(repository, config);
		this.postsService = new PostsService(repository, config);
		this.storageFilesService = new StorageFilesService(repository, config);

		this.headers = {};
		// ヘッダーのキーを小文字に変換して格納
		for (const headerKey of Object.keys(options.headers || {})) {
			this.headers[headerKey.toLowerCase()] = options.headers[headerKey];
		}

		this.responsed = false;
	}

	async proceed(rule) {
		if (rule == null) {
			rule = {};
		}

		// headers

		if (rule.headers == null) {
			rule.headers = [];
		}

		if (this.headers == null) {
			this.headers = {};
		}

		// ヘッダールールを小文字に変換
		const headerRules = [];
		for (const headerRule of rule.headers) {
			headerRules.push(headerRule.toLowerCase());
		}
		rule.headers = headerRules;

		// apiバージョンのヘッダールールがなければ追加
		if (rule.headers.indexOf('x-api-version') == -1) {
			rule.headers.push('x-api-version');
		}

		for (const header of rule.headers) {
			if (header == null) {
				throw new Error('headers rule is invalid');
			}

			if (this.headers[header] == null) {
				return this.response(400, `${header} header is empty`);
			}
		}

		// 必要であればApplicationKey、AccessKeyを検証
		if (rule.permissions == null) {
			rule.permissions = [];
		}

		if (rule.permissions.length !== 0 && (this.user == null || this.application == null)) {
			const applicationKey = this.headers['x-application-key'];
			const accessKey = this.headers['x-access-key'];

			if (applicationKey == null) {
				return this.response(400, 'x-application-key header is empty');
			}

			if (accessKey == null) {
				return this.response(400, 'x-access-key header is empty');
			}

			if (!await this.applicationsService.verifyApplicationKey(applicationKey)) {
				return this.response(400, 'x-application-key header is invalid');
			}

			if (!await this.applicationAccessesService.verifyAccessKey(accessKey)) {
				return this.response(400, 'x-access-key header is invalid');
			}

			this.applicationKey = applicationKey;
			this.accessKey = accessKey;

			const { userId } = this.applicationAccessesService.splitAccessKey(this.accessKey);
			const { applicationId } = this.applicationsService.splitApplicationKey(this.applicationKey);

			// fetch
			[this.user, this.application] = await Promise.all([
				this.repository.findById('users', userId),
				this.repository.findById('applications', applicationId)
			]);
		}

		// check permissions

		const hasPermissions = rule.permissions.every(p => this.applicationsService.hasPermission(this.application, p));
		if (!hasPermissions) {
			return this.response(403, 'you do not have any permissions');
		}

		// body

		if (rule.body == null) {
			rule.body = [];
		}

		for (const paramName of Object.keys(rule.body)) {
			if (this.body[paramName] == null) {
				const required = rule.body[paramName].default === undefined;
				if (required) {
					return this.response(400, `body parameter '${paramName}' is require`);
				}
				else {
					this.body[paramName] = rule.body[paramName].default;
				}
			}
			else {
				if (rule.body[paramName].cafy == null) {
					throw new Error('cafy is required');
				}

				if (rule.body[paramName].cafy.nok(this.body[paramName])) {
					return this.response(400, `body parameter '${paramName}' is invalid`);
				}
			}
		}

		// query strings

		if (rule.query == null) {
			rule.query = [];
		}

		for (const paramName of Object.keys(rule.query)) {
			if (this.query[paramName] == null) {
				const required = rule.query[paramName].default === undefined;
				if (required) {
					return this.response(400, `query parameter '${paramName}' is require`);
				}
				else {
					this.query[paramName] = rule.query[paramName].default;
				}
			}
			else {
				if (rule.query[paramName].cafy == null) {
					throw new Error('cafy is required');
				}

				if (rule.query[paramName].cafy.nok(this.query[paramName])) {
					return this.response(400, `query parameter '${paramName}' is invalid`);
				}
			}
		}
	}

	response(statusCode, data, needStatusCode) {
		if (this.responsed) {
			throw new InvalidOperationError('already responsed');
		}
		this.statusCode = statusCode;
		this.data = data;
		this.needStatusCode = needStatusCode != false;
		this.responsed = true;
	}
}
module.exports = ApiContext;
