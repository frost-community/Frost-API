const objectSorter = require('../helpers/objectSorter');
const crypto = require('crypto');
const moment = require('moment');

class User {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		this.document = document;
		this.db = db;
	}

	// TODO: 各種操作用メソッドの追加

	verifyPassword(password) {
		if (password == null) {
			throw new Error('missing arguments');
		}

		const passwordHashElements = this.document.passwordHash.split('.');
		const hash = passwordHashElements[0];
		const salt = passwordHashElements[1];

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${password}.${salt}`);

		return hash == sha256.digest('hex');
	}

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
		if (id == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		return db.users.findByIdAsync(id);
	}

	/**
	 * 複数のscreenNameからドキュメントモデルのインスタンスを取得します
	 *
	 * @return {User}
	 */
	static async findArrayByScreenNamesAsync(screenNames, limit, db, config) {
		if (screenNames == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		const patterns = screenNames.map(screenName => new RegExp('^' + screenName + '$', 'i'));

		return db.users.findArrayAsync({ screenName: { $in: patterns } }, null, limit);
	}

	/**
	 * screenNameからドキュメントモデルのインスタンスを取得します
	 *
	 * @return {User}
	 */
	static async findByScreenNameAsync(screenName, db, config) {
		if (screenName == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		return db.users.findAsync({ screenName: new RegExp('^' + screenName + '$', 'i') });
	}

	static checkFormatScreenName(screenName) {
		if (screenName == null) {
			throw new Error('missing arguments');
		}

		return /^[a-zA-Z0-9_-]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName);
	}

	static checkFormatPassword(password) {
		if (password == null) {
			throw new Error('missing arguments');
		}

		return /^[!-~]{6,}$/.test(password);
	}
}
module.exports = User;
