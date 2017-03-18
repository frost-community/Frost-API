'use strict';

const type = require('../type');

class CheckParams {
	constructor(directoryRouter, db, config) {
		this.directoryRouter = directoryRouter;
	}

	execute(request, response, next) {
		try {
			const extensions = this.directoryRouter.findRoute(request.method.toLowerCase(), request.route.path).extensions;

			if ('params' in extensions && extensions.params.length !== 0) {
				for(const param of extensions.params) {
					if (param.type == null || param.name == null) {
						response.status(500).send({error: {message: 'internal error', details: 'extentions.params elements are missing'}});
						throw new Error('extentions.params elements are missing');
					}

					const paramType = param.type;
					const paramName = param.name;
					const isRequire = param.require != null ? param.require === true : true; // requireにtrueが設定されている場合は必須項目になる。デフォルトでtrue

					if (isRequire) {
						if (request.body[paramName] == null) {
							response.status(400).send({error: {message: `parameter '${paramName}' is require`}});
							return;
						}

						if (type(request.body[paramName]).toLowerCase() !== paramType.toLowerCase()) {
							response.status(400).send({error: {message: `type of parameter '${paramName}' is invalid`}});
							return;
						}
					}
				}
			}
		}
		catch(err) {
			console.log('checkParams failed');
			throw err;
		}

		next();
	}
}
module.exports = CheckParams;
