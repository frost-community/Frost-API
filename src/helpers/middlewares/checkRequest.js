'use strict';

const apiResult = require('../apiResult');
const type = require('../type');
const Application = require('../../documentModels/application');
const ApplicationAccess = require('../../documentModels/applicationAccess');

module.exports = (request, response, next) => {
	const isMiddleware = next != null;

	request.checkRequestAsync = async (routeConfig) => {
		try {
			if (routeConfig == null) {
				routeConfig = {};
			}

			// body
			if (routeConfig.body == null) {
				routeConfig.body = [];
			}

			for(const param of routeConfig.body) {
				if (param.type == null || param.name == null) {
					throw new Error('extentions.body elements are missing');
				}

				const paramType = param.type;
				const paramName = param.name;
				const isRequire = param.require != null ? param.require === true : true; // requireにtrueが設定されている場合は必須項目になる。デフォルトでtrue

				if (isRequire) {
					if (request.body[paramName] == null) {
						throw new apiResult(400, `body parameter '${paramName}' is require`);
					}

					if (type(request.body[paramName]).toLowerCase() !== paramType.toLowerCase()) {
						throw new apiResult(400, `type of body parameter '${paramName}' is invalid`);
					}
				}
			}

			// query strings
			if (routeConfig.query == null) {
				routeConfig.query = [];
			}

			for(const query of routeConfig.query) {
				if (query.type == null || query.name == null) {
					throw new Error('extentions.query elements are missing');
				}

				const queryType = query.type;
				const queryName = query.name;
				const isRequire = query.require != null ? query.require === true : true; // requireにtrueが設定されている場合は必須項目になる。デフォルトでtrue

				if (isRequire) {
					let requestQuery = null;

					try {
						requestQuery = request.query[queryName];
					}
					catch(e) {
						/* noop */
					}

					if (requestQuery == null) {
						throw new apiResult(400, `query '${queryName}' is require`);
					}

					if (type(requestQuery).toLowerCase() !== queryType.toLowerCase()) {
						throw new apiResult(400, `type of query '${queryName}' is invalid`);
					}
				}
			}

			// permissions
			if (routeConfig.permissions == null) {
				routeConfig.permissions = [];
			}

			if (routeConfig.permissions.length !== 0) {
				if (isMiddleware) {
					const applicationKey = request.get('X-Application-Key');
					const accessKey = request.get('X-Access-Key');

					if (applicationKey == null) {
						throw new apiResult(400, 'X-Application-Key header is empty');
					}

					if (accessKey == null) {
						throw new apiResult(400, 'X-Access-Key header is empty');
					}

					if (!await Application.verifyKeyAsync(applicationKey, request.db, request.config)) {
						throw new apiResult(400, 'X-Application-Key header is invalid');
					}

					if (!await ApplicationAccess.verifyKeyAsync(accessKey, request.db, request.config)) {
						throw new apiResult(400, 'X-Access-Key header is invalid');
					}

					const applicationId = Application.splitKey(applicationKey, request.db, request.config).applicationId;
					const userId = ApplicationAccess.splitKey(accessKey, request.db, request.config).userId;

					request.application = (await request.db.applications.findByIdAsync(applicationId));
					request.user = (await request.db.users.findByIdAsync(userId));
				}

				const hasPermissions = routeConfig.permissions.every(p => request.application.hasPermission(p));
				if (!hasPermissions) {
					throw new apiResult(403, 'you do not have any permissions');
				}
			}

			// headers
			if (routeConfig.headers == null) {
				routeConfig.headers = [];
			}

			if (request.headers == null) {
				request.headers = [];
			}

			if (routeConfig.headers.indexOf('X-Api-Version') == -1) {
				routeConfig.headers.push('X-Api-Version');
			}

			for(const header of routeConfig.headers) {
				if (header == null) {
					throw new Error('extentions.headers elements are missing');
				}

				if (isMiddleware) {
					if (request.get(header) == null) {
						throw new apiResult(400, `${header} header is empty`);
					}
				}
				else {
					let requestHeader = null;

					try {
						requestHeader = request.headers[header.toLowerCase()];
					}
					catch(e) {
						/* noop */
					}

					if (requestHeader == null) {
						throw new apiResult(400, `${header} header is empty`);
					}
				}
			}

			return null;
		}
		catch(e) {
			if (e instanceof Error) {
				console.log(`checkRequest failed: ${e}`);
				throw e;
			}
			else {
				return e;
			}
		}
	};

	if (isMiddleware) {
		next();
	}
};
