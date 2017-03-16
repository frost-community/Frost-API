'use strict';

const type = require('./type');
const mongo = require('mongodb');

class CollectionBase {
	constructor(collectionName, targetDocumentModel, db, config) {
		if (collectionName == null || targetDocumentModel == null)
			throw new Error('missing arguments');

		this.collectionName = collectionName;
		this.targetDocumentModel = targetDocumentModel;
		this.db = db;
		this._config = config;
	}

	async createAsync(data) {
		const result = await this.db.dbProvider.createAsync(this.collectionName, data);

		return this.targetDocumentModel(result.ops[0], this.db, this._config);
	}

	async findAsync(query) {
		const document = await this.db.dbProvider.findAsync(this.collectionName, query);

		if (document == null)
			return null;

		return this.targetDocumentModel(document, this.db, this._config);
	}

	async findIdAsync(id) {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectID(id);
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
		for (const document of documents)
			res.push(this.targetDocumentModel(document, this.db, this._config));

		return res;
	}

	async updateAsync(query, data) {
		await this.db.dbProvider.updateAsync(this.collectionName, query, data);
	}

	async updateIdAsync(id, data) {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectID(id);
		}
		catch(e) {
			return null;
		}

		return await this.updateAsync({_id: parsedId}, data);
	}

	async removeAsync(query) {
		await this.db.dbProvider.removeAsync(this.collectionName, query);
	}
}
exports.CollectionBase = CollectionBase;

class Applications extends CollectionBase {
	constructor(db, config) {
		super('applications', require('../documentModels/application'), db, config);
	}
}
exports.Applications = Applications;

class ApplicationAccesses extends CollectionBase {
	constructor(db, config) {
		super('applicationAccesses', require('../documentModels/applicationAccess'), db, config);
	}
}
exports.ApplicationAccesses = ApplicationAccesses;

class AuthorizeRequests extends CollectionBase {
	constructor(db, config) {
		super('authorizeRequests', require('../documentModels/authorizeRequest'), db, config);
	}
}
exports.AuthorizeRequests = AuthorizeRequests;

class Posts extends CollectionBase {
	constructor(db, config) {
		super('posts', require('../documentModels/post'), db, config);
	}
}
exports.Posts = Posts;

class Users extends CollectionBase {
	constructor(db, config) {
		super('users', require('../documentModels/user'), db, config);
	}
}
exports.Users = Users;

class UserFollowings extends CollectionBase {
	constructor(db, config) {
		super('userFollowings', require('../documentModels/userFollowing'), db, config);
	}
}
exports.UserFollowings = UserFollowings;
