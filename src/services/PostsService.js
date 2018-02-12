const { ObjectId } = require('mongodb');
const moment = require('moment');
const UsersService = require('./UsersService');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');

class PostsService {
	/**
	 * @param {MongoAdapter} repository
	 * @param {UsersService} usersService
	*/
	constructor(repository, config, usersService) {
		if (repository == null || config == null|| usersService == null)
			throw new MissingArgumentsError();

		this._repository = repository;
		this._config = config;
		this._usersService = usersService;
	}

	async serialize(document, includeEntity) {
		if (document == null || includeEntity == null)
			throw new MissingArgumentsError();

		const res = Object.assign({}, document);

		if (includeEntity) {
			// user
			const user = await this._repository.findById('users', res.userId);
			if (user != null) {
				res.user = await this._usersService.serialize(user);
			}
		}

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// userId
		res.userId = res.userId.toString();

		// attachmentIds
		if (res.attachmentIds != null) {
			res.attachmentIds = res.attachmentIds.map(id => id.toString());
		}

		return sortObject(res);
	}

	// helpers

	/**
	 * @param {String | ObjectId} userId
	 * @param {String} text
	 * @param {ObjectId[]} attachmentIds
	 * @returns {PostDocument}
	*/
	async createStatusPost(userId, text, attachmentIds) {
		if (userId == null || text == null)
			throw new MissingArgumentsError();

		const data = {
			type: 'status',
			userId,
			text
		};

		if (attachmentIds.length != 0) {
			data.attachmentIds = attachmentIds;
		}

		let document;
		try {
			document = await this._repository.create('posts', data);
		}
		catch (err) {
			console.log(err);
		}
		return document;
	}

	/**
	 * @param {String | ObjectId} userId
	 * @param {String} text
	 * @param {String} title
	 * @returns {PostDocument}
	*/
	async createArticlePost(userId, text, title) {
		if (userId == null || text == null || title == null)
			throw new MissingArgumentsError();

		let document;
		try {
			document = await this._repository.create('posts', {
				type: 'article',
				userId,
				title,
				text
			});
		}
		catch (err) {
			console.log(err);
		}
		return document;
	}
}
module.exports = PostsService;
