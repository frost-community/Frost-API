'use strict';

const mongo = require('mongodb');

class DbProvider {
	constructor(connection) {
		if (connection == null) {
			throw new Error('missing arguments');
		}

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
		if (collectionName == null || data == null) {
			throw new Error('missing arguments');
		}

		const document = (await this.connection.collection(collectionName).insert(data)).ops[0];
		return await this.findAsync(collectionName, {_id: document._id});
	}

	/**
	 * ドキュメントを検索して単数の項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} options
	 * @return {Promise<any>}
	 */
	async findAsync(collectionName, query, options) {
		if (collectionName == null || query == null) {
			throw new Error('missing arguments');
		}

		return await this.connection.collection(collectionName).findOne(query, options);
	}

	/**
	 * ドキュメントを検索して複数の項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} sortOption
	 * @param  {number} limit
	 * @return {Promise<any>}
	 */
	async findArrayAsync(collectionName, query, sortOption, limit) {
		if (collectionName == null || query == null) {
			throw new Error('missing arguments');
		}

		let cursor = this.connection.collection(collectionName).find(query);

		if (limit != null) {
			cursor = cursor.limit(limit);
		}

		if (sortOption != null) {
			cursor = cursor.sort(sortOption);
		}

		return await cursor.toArray();
	}

	createSortOptionNatural(ascending) {
		return {$natural: (ascending ? 1 : -1)};
	}

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @param  {object} data
	 * @param  {object} options
	 * @return {Promise<any>}
	 */
	async updateAsync(collectionName, query, data, options) {
		if (collectionName == null || query == null || data == null) {
			throw new Error('missing arguments');
		}

		options = options || {};

		return (await this.connection.collection(collectionName).update(query, options.renewal ? data : {$set: data}, options)).result;
	}

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {object} query
	 * @return {Promise<any>}
	 */
	async removeAsync(collectionName, query) {
		if (collectionName == null || query == null) {
			throw new Error('missing arguments');
		}

		return await this.connection.collection(collectionName).remove(query);
	}

	// static methods

	/**
	 * データベースに接続します
	 *
	 * host, dbname, [authenticate]
	 * @return {Promise}
	 */
	static async connectAsync(host, dbname, authenticate) {
		if (host == null || dbname == null || authenticate == null) {
			throw new Error('missing arguments');
		}

		return await (new Promise((resolve, reject) => {
			if (host == null || dbname == null) {
				reject('missing arguments');
			}

			mongo.MongoClient.connect(`mongodb://${authenticate}@${host}/${dbname}`, (err, connection) => {
				if (err || connection == null) {
					return reject('failed to connect database');
				}

				return resolve(new DbProvider(connection));
			});
		}));
	}

	/**
	 * APIデータベースに接続します
	 */
	static async connectApidbAsync(config) {
		if (config == null) {
			throw new Error('missing arguments');
		}

		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		return await DbProvider.connectAsync(
			config.api.database.host,
			config.api.database.database,
			authenticate);
	}
}
module.exports = DbProvider;
