const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');

class UsersService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		if (repository == null || config == null)
			throw new MissingArgumentsError();

		this._repository = repository;
		this._config = config;
	}

	/**
	 * @param {String} password
	 * @param {Object} userDocument
	 * @returns {Boolean}
	*/
	checkCorrectPassword(userDocument, password) {
		if (password == null || userDocument == null)
			throw new MissingArgumentsError();

		const [hash, salt] = userDocument.passwordHash.split('.');

		return hash == buildHash(`${password}.${salt}`);
	}

	async serialize(userDocument) {
		if (userDocument == null)
			throw new MissingArgumentsError();

		const res = Object.assign({}, userDocument);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// passwordHash
		delete res.passwordHash;

		// followingsCount, followersCount, postsCount.status
		res.postsCount = {};
		[res.followingsCount, res.followersCount, res.postsCount.status] = await Promise.all([
			this._repository.count('userFollowings', { source: userDocument._id }),
			this._repository.count('userFollowings', { target: userDocument._id }),
			this._repository.count('posts', { type: 'status', userId: userDocument._id })
		]);

		return sortObject(res);
	}

	// helpers

	/**
	 * @param {String} screenName
	 * @param {String} password
	 * @param {String} name
	 * @param {String} description
	 * @returns {UserDocument}
	*/
	create(screenName, password, name, description, options) {
		options = options || {};
		if (screenName == null || !options.root && password == null || name == null || description == null)
			throw new MissingArgumentsError();

		let passwordHash;
		if (password != null) {
			const salt = randomRange(1, 99999);
			const hash = buildHash(`${password}.${salt}`);
			passwordHash = `${hash}.${salt}`;
		}

		const data = { screenName, passwordHash, name, description };

		if (options.root) {
			data.root = true;
		}

		return this._repository.create('users', data);
	}

	/**
	 * screenNameからUserドキュメントを取得します
	 *
	 * @param {String} screenName
	 * @returns {Promise<UserDocument>}
	*/
	async findByScreenName(screenName) {
		if (screenName == null)
			throw new MissingArgumentsError();

		return this._repository.find('users', { screenName: new RegExp(`^${screenName}$`, 'i') });
	}

	/**
	 * 複数のscreenNameからドキュメントモデルのインスタンスを取得します
	 *
	 * @param {String[]} screenNames
	 * @param {{isAscending: Boolean, limit: Number, since: ObjectId, until: ObjectId}} options
	 * @returns {Promise<UserDocument>}
	*/
	async findArrayByScreenNames(screenNames, options) {
		if (screenNames == null)
			throw new MissingArgumentsError();

		const patterns = screenNames.map(screenName => new RegExp(`^${screenName}$`, 'i'));

		return this._repository.findArray('users', { screenName: { $in: patterns } }, options);
	}

	/**
	 * @param {String} screenName
	 * @returns {Boolean}
	*/
	validFormatScreenName(screenName) {
		if (screenName == null)
			throw new MissingArgumentsError();

		return /^[a-zA-Z0-9_-]{4,15}$/.test(screenName) && !/^(.)\1{3,}$/.test(screenName);
	}

	/**
	 * @param {String} screenName
	 * @returns {Boolean}
	*/
	availableScreenName(screenName) {
		if (screenName == null)
			throw new MissingArgumentsError();

		const isNotInvalidScreenName = this._config.api.invalidScreenNames.every(invalidScreenName => screenName != invalidScreenName);

		return this.validFormatScreenName(screenName) && isNotInvalidScreenName;
	}

	async nonDuplicatedScreenName(screenName) {
		if (screenName == null)
			throw new MissingArgumentsError();

		return (await this.findByScreenName(screenName)) == null;
	}

	/**
	 * @param {String} password
	 * @returns {Boolean}
	*/
	checkFormatPassword(password) {
		if (password == null)
			throw new MissingArgumentsError();

		return /^[!-~]{6,}$/.test(password);
	}
}
module.exports = UsersService;
