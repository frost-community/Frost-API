const UsersService = require('../services/UsersService');
const UserFollowingsService = require('../services/UserFollowingsService');
const PostsService = require('../services/PostsService');
const StorageFilesService = require('../services/StorageFilesService');
const ApplicationsService = require('../services/ApplicationsService');
const TokensService = require('../services/TokensService');
const { InvalidOperationError } = require('./errors');
const { getType } = require('./helpers/GeneralHelper');
const AsyncLock = require('async-lock');
const MongoAdapter = require('./MongoAdapter');

class ApiContext {
	/**
	 * @param {MongoAdapter} repository
	 * @param {} config
	 * @param {{user, authInfo, targetVersion, streams, lock: AsyncLock, params, query, body}} options
	*/
	constructor(repository, config, options) {
		this.repository = repository;
		this.config = config;
		options = options || {};
		this.user = options.user;
		this.authInfo = options.authInfo || {};
		this.targetVersion = options.targetVersion;
		this.streams = options.streams;
		this.lock = options.lock;
		this.params = options.params || {};
		this.query = options.query || {};
		this.body = options.body || {};

		// service instances
		this.usersService = new UsersService(repository, config);
		this.userFollowingsService = new UserFollowingsService(repository, config);
		this.postsService = new PostsService(repository, config, this.usersService);
		this.storageFilesService = new StorageFilesService(repository, config);
		this.applicationsService = new ApplicationsService(repository, config);
		this.tokensService = new TokensService(repository, config);

		this.responsed = false;
	}

	async proceed(rule) {
		if (rule == null) {
			rule = {};
		}

		// check scopes

		if (rule.scopes == null) {
			rule.scopes = [];
		}
		if (this.authInfo.scopes == null) {
			this.authInfo.scopes = [];
		}

		const missingScopes = [];
		for (const p of rule.scopes) {
			if (this.authInfo.scopes.indexOf(p) == -1) {
				missingScopes.push(p);
			}
		}
		if (missingScopes.length != 0) {
			return this.response(403, { message: 'you do not have some scopes', details: missingScopes });
		}

		// body

		if (rule.body == null) {
			rule.body = [];
		}

		for (const paramName of Object.keys(rule.body)) {
			if (this.body[paramName] == null || this.body[paramName] === '') {
				const required = rule.body[paramName].default === undefined;
				if (required) {
					return this.response(400, `body parameter '${paramName}' is required`);
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
					return this.response(400, `query parameter '${paramName}' is required`);
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

	response(statusCode, data) {
		if (this.responsed) {
			throw new InvalidOperationError('already responsed');
		}
		this.statusCode = statusCode;

		if (getType(data) == 'String') {
			this.data = { message: data };
		}
		else {
			this.data = data;
		}

		this.responsed = true;
	}
}
module.exports = ApiContext;
