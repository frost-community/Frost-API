'use strict';

const objectSorter = require('../helpers/objectSorter');
const moment = require('moment');

class User {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
	}

	// TODO: 各種操作用メソッドの追加

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// passwordHash
		delete res.passwordHash;

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.users.findByIdAsync(this.document._id)).document;
	}

	// static methods

	/**
	 * idからドキュメントモデルのインスタンスを取得します
	 * 
	 * @return {User}
	 */
	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.users.findByIdAsync(id);
	}

	/**
	 * screenNameからドキュメントモデルのインスタンスを取得します
	 * 
	 * @return {User}
	 */
	static async findByScreenNameAsync(screenName, db, config) {
		if (screenName == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.users.findAsync({screenName: screenName});
	}
}
module.exports = User;
