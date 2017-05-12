'use strict';

const objectSorter = require('../helpers/objectSorter');
const moment = require('moment');

class Post {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
	}

	// TODO: 各種操作用メソッドの追加

	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.posts.findByIdAsync(id);
	}

	static async findArrayByTypeAsync(type, ascending, limit, db, config) {
		if (type == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.posts.findArrayAsync({type: type}, {$natural: (ascending ? 1 : -1)}, limit);
	}

	async serializeAsync(includeEntity) {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		if (includeEntity === true) {
			// user
			res.user = (await this.db.users.findByIdAsync(res.userId)).serialize();
		}

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.posts.findByIdAsync(this.document._id)).document;
	}
}
module.exports = Post;
