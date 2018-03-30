const path = require('path');
const semver = require('semver');

/** @return {{version: string, dataFormatVersion: string}} バージョン */
module.exports = () => {
	const packageInfo = require(path.resolve('package.json'));

	const version = packageInfo.version;
	const dataFormatVersion = `${semver.major(version)}.${semver.minor(version)}.0`;

	return {
		version,
		dataFormatVersion
	};
};
