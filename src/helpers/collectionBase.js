'use strict';

const type = require('./type');
const mongo = require('mongodb');

class CollectionBase {
	constructor(collectionName, documentModelName, db, config) {
		if (collectionName == null || documentModelName == null || db == null || config == null)
			throw new Error('missing arguments');

		this.collectionName = collectionName;
		this.documentModelName = documentModelName;
		this.db = db;
		this._config = config;
	}

	async createAsync(data) {
		const result = await this.db.dbProvider.createAsync(this.collectionName, data);

		return new (require(this.documentModelName))(result, this.db, this._config);
	}

	async findAsync(query) {
		const document = await this.db.dbProvider.findAsync(this.collectionName, query);

		if (document == null)
			return null;

		return new (require(this.documentModelName))(document, this.db, this._config);
	}

	async findByIdAsync(id) {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectId(id);
		}
		catch(e) {
			return null;
		}

		return await this.findAsync({_id: parsedId});
	}

	async findArrayAsync(query) {
		const documents = await this.db.dbProvider.findArrayAsync(this.collectionName, query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		documents.forEach(document => {
			res.push(new (require(this.documentModelName))(document, this.db, this._config));
		});

		return res;
	}

	async updateAsync(query, data) {
		return (await this.db.dbProvider.updateAsync(this.collectionName, query, data)).result;
	}

	async updateByIdAsync(id, data) {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectId(id);
		}
		catch(e) {
			console.log(e);
			return null;
		}

		return await this.updateAsync({_id: parsedId}, data);
	}

	async removeAsync(query) {
		return await this.db.dbProvider.removeAsync(this.collectionName, query);
	}
}
module.exports = CollectionBase;
