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
	 * @param  {string} data
	 */
	async createAsync(collectionName, data) {
		return await this.connection.collection(collectionName).insert(data);
	}

	/**
	 * ドキュメントを検索して項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} option
	 * @param  {Object|null} document
	 */
	async findAsync(collectionName, query, option) {
		return await this.connection.collection(collectionName).findOne(query, option);
	}

	/**
	 * ドキュメントを検索して複数の項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} option
	 * @param  {Object[]|null} documents
	 */
	async findArrayAsync(collectionName, query, option) {
		return await this.connection.collection(collectionName).find(query, option).toArray();
	}

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} data
	 * @param  {Boolean} isMany
	 */
	async updateAsync(collectionName, query, data) {
		return await this.connection.collection(collectionName).update(query, {$set: data});
	}

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 */
	async removeAsync(collectionName, query) {
		return await this.connection.collection(collectionName).remove(query);
	}

	/**
	 * データベースに接続します
	 *
	 * host, dbname, [authenticate]
	 * @return {Promise}
	 */
	static connectAsync(host, dbname, authenticate) {
		return new Promise((resolve, reject) => {
			if (host == null || dbname == null)
				reject('missing arguments');

			mongo.MongoClient.connect(`mongodb://${authenticate}@${host}/${dbname}`, (err, connection) => {
				if (err || connection == null)
					return reject('faild to connect database');

				return resolve(new DbProvider(connection));
			});
		});
	}

	/**
	 * APIデータベースに接続します
	 */
	static async connectApidbAsync(config) {
		if (config == null)
			throw new Error('missing arguments');

		const host = config.api.database.port != null ? `${config.api.database.host}:${config.api.database.port}` : config.api.database.host;
		const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
		return await DbProvider.connectAsync(
			host,
			config.api.database.database,
			authenticate);
	}
}
module.exports = DbProvider;
