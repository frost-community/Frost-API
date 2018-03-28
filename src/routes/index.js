const ApiContext = require('../modules/ApiContext');
const semver = require('semver');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: []
	});
	if (apiContext.responsed) return;

	const packageInfo = require(require('path').resolve('package.json'));

	apiContext.response(200, {
		message: 'Frost API Server',
		version: `${semver.major(packageInfo.version)}.${semver.minor(packageInfo.version)}`
	});
};
