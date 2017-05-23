'use strict';

const path = require('path');
const pathToRegexp = require('path-to-regexp');

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

	getParams(endpoint) {
		const keys = [];
		const pathRegex = pathToRegexp(this.path, keys);
		const values = pathRegex.exec(endpoint);

		const params = [];
		for (let i = 0; i < keys.length; i++) {
			params[keys[i].name] = values[i+1];
		}

		return params;
	}
}
module.exports = Route;
