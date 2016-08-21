'use strict';

var mongodb = require('mongodb');
const config = require('./load-config')();

exports = () => {
	var instance = {};

	/**
	 * データベースに接続します
	 *
	 * host, port, dbname, [user, password]
	 * @return {Promise}
	 */
	instance.connect = (host, port, dbname, username, password) => new Promise((resolve, reject) => {
		var authenticate = "";

		if (username != undefined && password != undefined)
			authenticate = `${username}:${password}@`;

		mongodb.MongoClient.connect(`mongodb://${authenticate}${host}:${port}/${dbname}`, (err, db) => {
			if (err)
				return reject('faild to connect database');

			return resolve(require('./database')(db));
		});
	});

	instance.connectApidb = () => {
		return exports.connect(config.api.database.host , config.api.database.port, config.api.database.database, config.api.database.username, config.api.database.password);
	};
}
