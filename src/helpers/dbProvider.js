'use strict';

const mongo = require('mongodb');

class DbProvider {
	constructor(connection) {
		if (connection == null)
			throw new Error('missing arguments');

		this.connection = connection;
	}

	/**
	 * ドキュメントを作成します
	 *
	 * @param  {string} collectionName コレクション名
	 * @param  {object} data
	 * @return {Promise<any>}
	 */
	async createAsync(collectionName, data) {
		if (collectionName == null || data == null)
			throw new Error('missing arguments');

		try {
			return (await this.connection.collection(collectionName).insert(data)).ops[0];
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	/**
	 * ドキュメントを検索して項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} option
	 * @return {Promise<any>}
	 */
	async findAsync(collectionName, query, option) {
		if (collectionName == null || query == null)
			throw new Error('missing arguments');

		try {
			return await this.connection.collection(collectionName).findOne(query, option);
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	/**
	 * ドキュメントを検索して複数の項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} option
	 * @param  {number} limit
	 * @return {Promise<any>}
	 */
	async findArrayAsync(collectionName, query, option, limit) {
		if (collectionName == null || query == null)
			throw new Error('missing arguments');

		try {
			if (limit != null)
				return await this.connection.collection(collectionName).find(query, option).limit(limit).toArray();
			else
				return await this.connection.collection(collectionName).find(query, option).toArray();
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} data
	 * @return {Promise<any>}
	 */
	async updateAsync(collectionName, query, data) {
		if (collectionName == null || query == null || data == null)
			throw new Error('missing arguments');

		try {
			return await this.connection.collection(collectionName).update(query, {$set: data});
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @return {Promise<any>}
	 */
	async removeAsync(collectionName, query) {
		if (collectionName == null || query == null)
			throw new Error('missing arguments');

		try {
			return await this.connection.collection(collectionName).remove(query);
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	// static methods

	/**
	 * データベースに接続します
	 *
	 * host, dbname, [authenticate]
	 * @return {Promise}
	 */
	static async connectAsync(host, dbname, authenticate) {
		if (host == null || dbname == null || authenticate == null)
			throw new Error('missing arguments');

		try {
			return await (new Promise((resolve, reject) => {
				if (host == null || dbname == null)
					reject('missing arguments');

				mongo.MongoClient.connect(`mongodb://${authenticate}@${host}/${dbname}`, (err, connection) => {
					if (err || connection == null)
						return reject('faild to connect database');

					return resolve(new DbProvider(connection));
				});
			}));
		}
		catch(e) {
			console.log(e.trace);
			throw new Error(e);
		}
	}

	/**
	 * APIデータベースに接続します
	 */
	static async connectApidbAsync(config) {
		if (config == null)
			throw new Error('missing arguments');

		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		return await DbProvider.connectAsync(
			config.api.database.host,
			config.api.database.database,
			authenticate);
	}
}
module.exports = DbProvider;
