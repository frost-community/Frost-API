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
	instance.connectAsync = (host, dbname, username, password) => new Promise((resolve, reject) => {
		let authenticate = '';

		if (username != null && password != null)
			authenticate = `${username}:${password}@`;

		mongodb.MongoClient.connect(`mongodb://${authenticate}${host}/${dbname}`, (err, db) => {
			if (err)
				return reject('faild to connect database');

			return resolve(require('./dbManager')(db));
		});
	});

	instance.connectApidbAsync = async () => {
		await instance.connectAsync(
			`${config.api.database.host}:${config.api.database.port}`,
			config.api.database.database,
			config.api.database.username,
			config.api.database.password);
	};

	return instance;
};
