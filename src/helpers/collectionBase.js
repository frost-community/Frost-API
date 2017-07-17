'use strict';

const mongo = require('mongodb');

class CollectionBase {
	constructor(collectionName, documentModelName, db, config) {
		if (collectionName == null || documentModelName == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		this.collectionName = collectionName;
		this.documentModelName = documentModelName;
		this.db = db;
		this._config = config;
	}

	async createAsync(data) {
		if (data == null) {
			throw new Error('missing arguments');
		}

		const result = await this.db.dbProvider.createAsync(this.collectionName, data);

		return new (require(this.documentModelName))(result, this.db, this._config);
	}

	async findAsync(query) {
		if (query == null) {
			throw new Error('missing arguments');
		}

		const document = await this.db.dbProvider.findAsync(this.collectionName, query);

		if (document == null) {
			return null;
		}

		return new (require(this.documentModelName))(document, this.db, this._config);
	}

	async findByIdAsync(id) {
		if (id == null) {
			throw new Error('missing arguments');
		}

		let parsedId = id;

		try {
			if (typeof id == 'string') {
				parsedId = mongo.ObjectId(id);
			}
		}
		catch(e) {
			console.log(e.trace);
			throw new Error('object id parse error');
		}

		return await this.findAsync({_id: parsedId});
	}

	async findArrayAsync(query, sortOption, limit) {
		if (query == null) {
			throw new Error('missing arguments');
		}

		const documents = await this.db.dbProvider.findArrayAsync(this.collectionName, query, sortOption, limit);

		if (documents == null || documents.length === 0) {
			return null;
		}

		const res = [];
		for (const document of documents) {
			res.push(new (require(this.documentModelName))(document, this.db, this._config));
		}

		return res;
	}

	async updateAsync(query, data, options) {
		if (query == null || data == null) {
			throw new Error('missing arguments');
		}

		return (await this.db.dbProvider.updateAsync(this.collectionName, query, data, options)).result;
	}

	upsertAsync(query, data, options) {
		options = options || {};
		options.upsert = true;

		return this.updateAsync(query, data, options);
	}

	updateByIdAsync(id, data, options) {
		if (id == null) {
			throw new Error('missing arguments');
		}

		let parsedId = id;

		try {
			if (typeof id == 'string') {
				parsedId = mongo.ObjectId(id);
			}
		}
		catch(e) {
			console.log(e.trace);
			throw new Error('object id parse error');
		}

		return this.updateAsync({_id: parsedId}, data, options);
	}

	upsertByIdAsync(id, data, options) {
		options = options || {};
		options.upsert = true;

		return this.updateByIdAsync(id, data, options);
	}

	removeAsync(query) {
		if (query == null) {
			throw new Error('missing arguments');
		}

		return this.db.dbProvider.removeAsync(this.collectionName, query);
	}

	removeByIdAsync(id) {
		if (id == null) {
			throw new Error('missing arguments');
		}

		let parsedId = id;

		try {
			if (!mongo.ObjectID.isValid(id) && typeof id != 'string')
				throw new Error('invalid ObjectId');

			if (typeof id == 'string') {
				parsedId = mongo.ObjectId(id);
			}
		}
		catch(e) {
			console.log(e.trace);
			throw new Error('object id parse error');
		}

		return this.removeAsync({_id: parsedId});
	}
}
module.exports = CollectionBase;
