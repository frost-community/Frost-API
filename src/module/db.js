'use strict';

var co = require('co');
var mongodb = require('mongodb');
const config = require('./load-config')();

/**
 * データベースに接続します
 *
 * host, port, dbname, [user, password]
 * @return {Promise}
 */
var connect = (host, port, dbname, username, password) => new Promise((resolve, reject) => {
	var authenticate = "";

	if (username != undefined && password != undefined)
		authenticate = `${username}:${password}@`;

	mongodb.MongoClient.connect(`mongodb://${authenticate}${host}:${port}/${dbname}`, (err, db) => {
		if (err)
			return reject('faild to connect database');

		return resolve(db);
	});
});
exports.connect = connect;

var connectApidb = () => {
	return connect(config.api.database.host , config.api.database.port, config.api.database.database, config.api.database.username, config.api.database.password);
}
exports.connectApidb = connectApidb;

var createCollection = (db, name, parameters) => new Promise((resolve, reject) => {
	db.createCollection(name, parameters, (err, result) => {
		if (err)
			return reject('faild to create collection');

		resolve(result);
	});
});
exports.createCollection = createCollection;

var createDocument = (db, collectionName, data) => new Promise((resolve, reject) => {
	db.collection(collectionName).insertOne(data,(err, result) => {
		if (err)
			return reject('faild to create document');

		resolve(result);
	});
});
exports.createDocument = createDocument;
