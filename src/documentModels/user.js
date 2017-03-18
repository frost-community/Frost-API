'use strict';

// const UserModel = require('../models/user').UserModel;

class User {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		// this.userModel = UserModel(db, config);
	}

	// TODO: 各種操作用メソッドの追加

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		// passwordHash
		delete res.passwordHash;

		return res;
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.users.findIdAsync(this.document._id)).document;
	}
}
exports.User = User;
