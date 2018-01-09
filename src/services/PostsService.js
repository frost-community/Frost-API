const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');
const UsersService = require('./UsersService');

class PostsService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		this._repository = repository;
		this._config = config;

		this._Users = new UsersService(repository, config);
	}

	/**
	 * @param {String | ObjectId} userId
	 * @param {String} text
	 * @returns {PostDocument}
	*/
	async createStatusPost(userId, text) {
		if (userId == null || text == null)
			throw new MissingArgumentsError();

		let document;
		try {
			document = await this._repository.create('posts', {
				type: 'status',
				userId,
				text
			});
		}
		catch (err) {
			console.log(err);
		}
		return document;
	}

	async serialize(document, includeEntity) {
		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		res._id = undefined;

		if (includeEntity === true) {
			// user
			const user = await this._repository.findById('users', res.userId);
			if (user != null) {
				res.user = await this._Users.serialize(user);
			}
		}

		return sortObject(res);
	}
}
module.exports = PostsService;
