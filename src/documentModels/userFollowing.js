'use strict';

const objectSorter = require('../helpers/objectSorter');
const moment = require('moment');

class UserFollowing {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

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

		Object.keys(res).sort();

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.userFollowings.findByIdAsync(this.document._id)).document;
	}

	async removeAsync() {
		await this.db.userFollowings.removeAsync({_id: this.document._id});
		this.document = null;
	}

	// static methods

	static async findBySrcDestAsync(source, destination, db, config) {
		if (source == null || destination == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		return db.userFollowings.findAsync({source: source, destination: destination});
	}
}
module.exports = UserFollowing;
