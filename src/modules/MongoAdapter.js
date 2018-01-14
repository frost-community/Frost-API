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

		return this._connection.collection(collectionName).findOne(query, options);
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

		return this.find(collectionName, { _id: MongoAdapter.buildId(id) }, options);
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

		if (options == null) options = {};

		const result = await this._connection.collection(collectionName).updateOne(query, options.renewal ? data : { $set: data }, options);

		if (result.result.ok != 1) {
			throw new Error('failed to update a database document');
		}

		const document = await this.find(collectionName, query);

		return document;
	}

	updateById(collectionName, id, data, options) {
		if (id == null) {
			throw new MissingArgumentsError();
		}

		return this.update(collectionName, { _id: MongoAdapter.buildId(id) }, data, options);
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

	disconnect() {
		return this._connection.close();
	}

	removeById(collectionName, id, options) {
		if (options == null)
			options = {};

		return this.remove(collectionName, { _id: MongoAdapter.buildId(id) }, options);
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
		if (!MongoAdapter.validateId(idSource))
			return null;

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
