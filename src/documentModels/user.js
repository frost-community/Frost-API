const crypto = require('crypto');
const moment = require('moment');
const UserFollowing = require('./userFollowing');
const objectSorter = require('../helpers/objectSorter');
const { MissingArgumentsError } = require('../helpers/errors');

class User {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		this.document = document;
		this.db = db;
		this.config = config;
	}

	// TODO: 各種操作用メソッドの追加

	verifyPassword(password) {
		if (password == null) {
			throw new MissingArgumentsError();
		}

		const passwordHashElements = this.document.passwordHash.split('.');
		const hash = passwordHashElements[0];
		const salt = passwordHashElements[1];

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${password}.${salt}`);

		return hash == sha256.digest('hex');
	}

	async serializeAsync() {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// passwordHash
		delete res.passwordHash;

		// followingsCount, followersCount
		let [followings, followers] = await Promise.all([
			UserFollowing.findTargetsAsync(this.document._id, 1000, this.db, this.config),
			UserFollowing.findSourcesAsync(this.document._id, 1000, this.db, this.config)
		]);
		res.followingsCount = (followings || []).length;
		res.followersCount = (followers || []).length;

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
	 * @return {Promise<User>}
	 */
	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		return db.users.findByIdAsync(id);
	}

	/**
	 * 複数のscreenNameからドキュメントモデルのインスタンスを取得します
	 *
	 * @return {Promise<User>}
	 */
	static async findArrayByScreenNamesAsync(screenNames, limit, db, config) {
		if (screenNames == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		const patterns = screenNames.map(screenName => new RegExp('^' + screenName + '$', 'i'));

		return db.users.findArrayAsync({ screenName: { $in: patterns } }, null, limit);
	}

	/**
	 * screenNameからドキュメントモデルのインスタンスを取得します
	 *
	 * @return {Promise<User>}
	 */
	static async findByScreenNameAsync(screenName, db, config) {
		if (screenName == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		return db.users.findAsync({ screenName: new RegExp('^' + screenName + '$', 'i') });
	}

	static checkFormatScreenName(screenName) {
		if (screenName == null) {
			throw new MissingArgumentsError();
		}

		return /^[a-zA-Z0-9_-]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName);
	}

	static checkFormatPassword(password) {
		if (password == null) {
			throw new MissingArgumentsError();
		}

		return /^[!-~]{6,}$/.test(password);
	}
}
module.exports = User;
