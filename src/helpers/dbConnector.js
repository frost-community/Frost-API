'use strict';

const mongodb = require('mongodb');
const config = require('./loadConfig')();

module.exports = () => {
	const instance = {};

	/**
	 * データベースに接続します
	 *
	 * host, dbname, [user, password]
	 * @return {Promise}
	 */
	instance.connectAsync = (host, dbname, authenticate) => new Promise((resolve, reject) => {
		mongodb.MongoClient.connect(`mongodb://${authenticate}@${host}/${dbname}`, (err, db) => {
			if (err)
				return reject('faild to connect database');

			return resolve(require('./dbManager')(db));
		});
	});

	instance.connectApidbAsync = async () => {
		const host = config.api.database.port != null ? `${config.api.database.host}:${config.api.database.port}` : config.api.database.host;
		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		await instance.connectAsync(
			host,
			config.api.database.database,
			authenticate);
	};

	return instance;
};
