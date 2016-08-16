'use strict';

const koaRoute = require('koa-route');
const methods = require('methods');

module.exports = (app, routes, before, after) => {
	if (!Array.isArray(routes) && routes != undefined && routes != null)
		throw new Error('routes is unknown type');

	routes.forEach((route) => {
		const method = route[0];
		const path = route[1];
		const permission = route[2];
		const generator = route[3];

		methods.forEach((m) => {
			if (method == m) {
				app.use(koaRoute[method](path, function *(req, res) {
					if (before != undefined)
						yield before(req, res);

					yield generator(req, res);

					if (after != undefined)
						yield after(req, res);
				}));
			}
		});
	});
}
