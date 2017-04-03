'use strict';

const path = require('path');

class Route {
	/**
	 * @param {string} method
	 * @param {string} path
	 */
	constructor(method, path) {
		if (method == null || path == null)
			throw new Error('missing arguments');

		if (typeof method != 'string' || typeof path != 'string')
			throw new Error('invalid type');

		this.method = method;
		this.path = path;
	}

	getMoludePath() {
		let modulePath = path.join(__dirname, '../routes', this.path.replace(/:/, ''));

		if (/(\/$|^$)/.test(modulePath))
			modulePath += 'index';

		modulePath = modulePath.replace(/\//g, path.sep);

		return modulePath;
	}
}
module.exports = Route;
