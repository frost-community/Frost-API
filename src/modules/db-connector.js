'use strict';

const mongodb = require('mongodb');
const config = require('./load-config')();

module.exports = () => {
	const instance = {};

	/**
	 * データベースに接続します
	 *
	 * host, port, dbname, [user, password]
	 * @return {Promise}
	 */
	instance.connect = (host, port, dbname, username, password) => new Promise((resolve, reject) => {
		let authenticate = "";

		if (username != undefined && password != undefined)
			authenticate = `${username}:${password}@`;

		mongodb.MongoClient.connect(`mongodb://${authenticate}${host}:${port}/${dbname}`, (err, db) => {
			if (err)
				return reject('faild to connect database');

			return resolve(require('./db-manager')(db));
		});
	});

	instance.connectApidb = () => {
		return instance.connect(config.api.database.host , config.api.database.port, config.api.database.database, config.api.database.username, config.api.database.password);
	};

	return instance;
}

