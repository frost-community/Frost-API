const Application = require('../documentModels/application');
const ApplicationAccess = require('../documentModels/applicationAccess');
const { ApiError } = require('../helpers/errors');

class ApiContext {
	constructor(streams, lock, db, config, options) {
		this.lock = lock;
		this.streams = streams;
		this.db = db;
		this.config = config;
		options = options || {};
		this.params = options.params;
		this.query = options.query;
		this.body = options.body;

		this.headers = {};
		// ヘッダーのキーを小文字に変換して格納
		for (const headerKey of Object.keys(options.headers || {})) {
			this.headers[headerKey.toLowerCase()] = options.headers[headerKey];
		}

		this.checked = false;
		this.responsed = false;
		this.testMode = options.testMode == true;
	}

	async check(rule) {
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
		for(const headerRule of rule.headers) {
			headerRules.push(headerRule.toLowerCase());
		}
		rule.headers = headerRules;

		// apiバージョンのヘッダールールがなければ追加
		if (rule.headers.indexOf('x-api-version') == -1) {
			rule.headers.push('x-api-version');
		}

		for (const header of rule.headers) {
			if (header == null) {
				throw new Error('extentions.headers elements are missing');
			}

			if (this.headers[header] == null) {
				throw new ApiError(400, `${header} header is empty`);
			}
		}

		// 必要であればApplicationKey、AccessKeyを検証
		if (rule.permissions == null) {
			rule.permissions = [];
		}

		if ((!this.testMode) && rule.permissions.length !== 0) {
			const applicationKey = this.headers['x-application-key'];
			const accessKey = this.headers['x-access-key'];

			if (applicationKey == null) {
				throw new ApiError(400, 'x-application-key header is empty');
			}

			if (accessKey == null) {
				throw new ApiError(400, 'x-access-key header is empty');
			}

			if (!await Application.verifyKeyAsync(applicationKey, this.db, this.config)) {
				throw new ApiError(400, 'x-application-key header is invalid');
			}

			if (!await ApplicationAccess.verifyKeyAsync(accessKey, this.db, this.config)) {
				throw new ApiError(400, 'x-access-key header is invalid');
			}

			this.applicationKey = applicationKey;
			this.accessKey = accessKey;
		}

		// body

		if (rule.body == null) {
			rule.body = [];
		}

		for (const paramName of Object.keys(rule.body)) {
			if (this.body[paramName] == null) {
				const required = rule.body[paramName].default === undefined;
				if (required) {
					throw new ApiError(400, `body parameter '${paramName}' is require`);
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
					throw new ApiError(400, `body parameter '${paramName}' is invalid`);
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
					throw new ApiError(400, `query parameter '${paramName}' is require`);
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
					throw new ApiError(400, `query parameter '${paramName}' is invalid`);
				}
			}
		}

		this.checked = true;
	}

	checkApiPermissions(rule) {
		if (this.application == null) {
			throw new Error('application has been not fetched');
		}

		const hasPermissions = rule.permissions.every(p => this.application.hasPermission(p));
		if (!hasPermissions) {
			throw new ApiError(403, 'you do not have any permissions');
		}
	}

	async fetchApplicationAndUser() {
		if (!this.checked) {
			throw new Error('request has been not checked');
		}

		const applicationId = Application.splitKey(this.applicationKey, this.db, this.config).applicationId;
		this.application = (await this.db.applications.findByIdAsync(applicationId));

		const userId = ApplicationAccess.splitKey(this.accessKey, this.db, this.config).userId;
		this.user = (await this.db.users.findByIdAsync(userId));
	}

	response(statusCode, data, needStatusCode) {
		this.statusCode = statusCode;
		this.data = data;
		this.needStatusCode = needStatusCode != false;
		this.responsed = true;
	}
}
module.exports = ApiContext;
