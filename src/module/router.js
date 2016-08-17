'use strict';

const methods = require('methods');

module.exports = (app, routes, before, after) => {
	if (!Array.isArray(routes) && routes != undefined && routes != null)
		throw new Error('routes is unknown type');

	routes.forEach((route) => {
		var method = route[0];
		const path = route[1];
		var extensions = route[2];

		method = method.replace(/^del$/, 'delete');

		methods.forEach((m) => {
			if (method == m) {
				app[m](path, function (req, res) {
					var dirPath = '../routes';

					path.substring(1).split(/\//).forEach((seg, i) => {
						dirPath += '/' + seg.replace(/:/, '');
					});

					const action = require(dirPath)[method];

					if (before != undefined)
						before(req, res, extensions);

					action(req, res);

					if (after != undefined)
						after(req, res, extensions);
				});
			}
		});
	});
}
