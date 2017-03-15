'use strict';

const mongodb = require('mongodb');

/**
 * データベースに接続します
 *
 * host, dbname, [user, password]
 * @return {Promise}
 */
module.exports.connectAsync = (host, dbname, authenticate) => new Promise((resolve, reject) => {
	if (host == null || dbname == null)
		reject('missing arguments');

	mongodb.MongoClient.connect(`mongodb://${authenticate}@${host}/${dbname}`, (err, connection) => {
		if (err || connection == null)
			return reject('faild to connect database');

		return resolve(require('./dbProvider')(connection));
	});
});

/**
 * APIデータベースに接続します
 */
module.exports.connectApidbAsync = async (config) => {
	if (config == null)
		throw new Error('missing arguments');

	const host = config.api.database.port != null ? `${config.api.database.host}:${config.api.database.port}` : config.api.database.host;
	const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
	return await exports.connectAsync(
		host,
		config.api.database.database,
		authenticate);
};
