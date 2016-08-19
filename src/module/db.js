'use strict';

var mongodb = require('mongodb');

/**
 * データベースに接続します
 *
 * host, port, dbname, [user, password]
 * @return {Promise}
 */
module.exports = (host, port, dbname, username, password) => new Promise(function (resolve, reject) {
	var authenticate = "";

	if (username != undefined && password != undefined)
		authenticate = `${username}:${password}@`;

	mongodb.MongoClient.connect(`mongodb://${authenticate}${host}:${port}/${dbname}`, (err, db) => {

		if (err)
			return reject('faild to connect database');

		resolve(db);
	});
});
