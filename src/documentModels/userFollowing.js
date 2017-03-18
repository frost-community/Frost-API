'use strict';

// const UserFollowingModel = require('../models/userFollowing').UserFollowingModel;

class UserFollowing {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		// this.userFollowingModel = UserFollowingModel(db, config);
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
		this.document = (await this.db.userFollowings.findIdAsync(this.document._id)).document;
	}
}
exports.UserFollowing = UserFollowing;
