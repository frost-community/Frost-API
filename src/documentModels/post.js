'use strict';

// const PostModel = require('../models/Post');

class Post {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		// this.postModel = PostModel(db, config);
	}

	// TODO: 各種操作用メソッドの追加

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.posts.findIdAsync(this.document._id)).document;
	}
}
module.exports = Post;
