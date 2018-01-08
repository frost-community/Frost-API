const { MongoClient, Db : Connection, ObjectId } = require('mongodb');
const { MissingArgumentsError } = require('./errors');

class MongoAdapter {
	/**
	 * @param {Connection} connection
	*/
	constructor(connection) {
		if (connection == null) {
			throw new MissingArgumentsError();
		}
		this._connection = connection;
	}

	/**
	 * ドキュメントを作成します
	 *
	 * @param {String} collectionName コレクション名
	 * @param {Object} data
	 * @return {Promise<any>}
	*/
	async create(collectionName, data) {
		if (collectionName == null || data == null) {
			throw new MissingArgumentsError();
		}

		const result = await this._connection.collection(collectionName).insert(data);
		const document = await this.find(collectionName, { _id: result.ops[0]._id });

		return document;
	}

	/**
	 * ドキュメントを検索して1つの項目を取得します
	 *
	 * @param {String} collectionName
	 * @param {Object} query
	 * @param {Object} options
	 * @return {Promise<any>}
	*/
	async find(collectionName, query, options) {
		if (collectionName == null || query == null) {
			throw new MissingArgumentsError();
		}

		const document = await this._connection.collection(collectionName).findOne(query, options);

		return document;
	}

	/**
	 * ドキュメントIDによりドキュメントを検索して1つの項目を取得します
	 *
	 * @param {String} collectionName
	 * @param {String|ObjectId} id
	 * @param {Object} options
	*/
	findById(collectionName, id, options) {
		if (id == null)
			throw new MissingArgumentsError();

		let builtId = id;
		if (typeof id == 'string')
			builtId = MongoAdapter.buildId(id);

		return this.find(collectionName, { _id: builtId }, options);
	}

	/**
	 * ドキュメントを検索して複数の項目を取得します
	 *
	 * @param {String} collectionName
	 * @param {Object} query
	 * @param {Object} sortOption
	 * @param {Number} limit
	 * @return {Promise<any[]>}
	*/
	async findArray(collectionName, query, isAscending, limit) {
		if (collectionName == null || query == null) {
			throw new MissingArgumentsError();
		}

		let cursor = this._connection.collection(collectionName).find(query);

		if (limit != null)
			cursor = cursor.limit(limit);

		if (isAscending != null)
			cursor = cursor.sort(MongoAdapter._buildSortOption(isAscending));

		const documents = await cursor.toArray();

		return documents;
	}

	/**
	 * クエリに一致するドキュメントの個数を取得します
	 *
	 * @param {String} collectionName
	 * @param {Object} query
	 * @return {Promise<Number>}
	*/
	async count(collectionName, query) {
		if (collectionName == null || query == null) {
			throw new MissingArgumentsError();
		}

		const documentsCount = await this._connection.collection(collectionName).count(query);

		return documentsCount;
	}

	/**
	 * ドキュメントを更新します
	 *
	 * @param {String} collectionName
	 * @param {Object} query
	 * @param {Object} data
	 * @param {Object} options
	 * @return {Promise<any>}
	*/
	async update(collectionName, query, data, options) {
		if (collectionName == null || query == null || data == null) {
			throw new MissingArgumentsError();
		}

		const result = await this._connection.collection(collectionName).update(query, options.renewal ? data : { $set: data }, options);
		const document = await this.find(collectionName, { _id: result.ops[0]._id });

		return document;
	}

	updateById(collectionName, id, data, options) {
		if (id == null) {
			throw new MissingArgumentsError();
		}

		let parsedId = id;
		if (typeof id == 'string')
			parsedId = MongoAdapter.buildId(parsedId);

		return this.update(collectionName, { _id: parsedId }, data, options);
	}

	upsert(collectionName, query, data, options) {
		if (options == null)
			options = {};

		options.upsert = true;

		return this.update(collectionName, query, data, options);
	}

	/**
	 * ドキュメントを削除します
	 *
	 * @param {string} collectionName
	 * @param {Object} query
	 * @param {Object} options
	 * @return {Promise<void>}
	*/
	async remove(collectionName, query, options) {
		if (collectionName == null || query == null) {
			throw new MissingArgumentsError();
		}

		await this._connection.collection(collectionName).remove(query, options);
	}

	removeById(collectionName, id, options) {
		if (options == null)
			options = {};

		let parsedId = id;
		if (typeof id == 'string')
			parsedId = MongoAdapter.buildId(parsedId);

		return this.remove(collectionName, { _id: parsedId }, options);
	}

	/**
	 * MongoDBに接続します
	 *
	 * host, dbname, [authenticate]
	 * @return {Promise<MongoAdapter>}
	*/
	static async connect(host, dbname, authenticate) {
		if (host == null || dbname == null || authenticate == null) {
			throw new MissingArgumentsError();
		}

		if (authenticate != null) authenticate += '@';

		return new MongoAdapter(await MongoClient.connect(`mongodb://${authenticate}${host}/${dbname}`));
	}

	static buildId(idSource) {
		return new ObjectId(idSource);
	}

	static validateId(id) {
		return ObjectId.isValid(id);
	}

	static _buildSortOption(isAscending) {
		return { $natural: (isAscending ? 1 : -1) };
	}
}
module.exports = MongoAdapter;

/*
// collections
applications
applicationAccesses
authorizeRequests
posts
users
userFollowings
storageFiles
*/

// connectApidbAsync()
// const authenticate = config.api.database.password != null ? `${config.api.database.username}:${config.api.database.password}` : config.api.database.username;
// config.api.database.host, config.api.database.database, authenticate
