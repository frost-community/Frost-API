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

		const hoge = require(this.documentModelName);

		return new hoge(result.ops[0], this.db, this._config);
	}

	async findAsync(query) {
		const document = await this.db.dbProvider.findAsync(this.collectionName, query);

		if (document == null)
			return null;

		const hoge = require(this.documentModelName);

		return new hoge(document, this.db, this._config);
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
		for (const document of documents) {
			const hoge = require(this.documentModelName);
			res.push(new hoge(document, this.db, this._config));
		}

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
		super('applications', '../documentModels/application', db, config);
	}
}
exports.Applications = Applications;

class ApplicationAccesses extends CollectionBase {
	constructor(db, config) {
		super('applicationAccesses', '../documentModels/applicationAccess', db, config);
	}
}
exports.ApplicationAccesses = ApplicationAccesses;

class AuthorizeRequests extends CollectionBase {
	constructor(db, config) {
		super('authorizeRequests', '../documentModels/authorizeRequest', db, config);
	}
}
exports.AuthorizeRequests = AuthorizeRequests;

class Posts extends CollectionBase {
	constructor(db, config) {
		super('posts', '../documentModels/post', db, config);
	}
}
exports.Posts = Posts;

class Users extends CollectionBase {
	constructor(db, config) {
		super('users', '../documentModels/user', db, config);
	}
}
exports.Users = Users;

class UserFollowings extends CollectionBase {
	constructor(db, config) {
		super('userFollowings', '../documentModels/userFollowing', db, config);
	}
}
exports.UserFollowings = UserFollowings;
