const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');

class UserFollowingsService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		this._repository = repository;
		this._config = config;
	}

	serialize(document) {
		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		res._id = undefined;

		return sortObject(res);
	}

	// helpers

	async create(sourceUserId, targetUserId, message) {
		let resultUpsert;
		try {
			resultUpsert = await this._repository.upsert('userFollowings', { source: sourceUserId, target: targetUserId },
				{ source: sourceUserId, target: targetUserId, message }
			);
		}
		catch (err) {
			console.log(err);
		}
		return resultUpsert;
	}

	async removeBySrcDestId(sourceUserId, targetUserId) {
		try {
			await this._repository.remove('userFollowings', { source: sourceUserId, target: targetUserId });
		}
		catch (err) {
			console.log(err);
		}
	}

	async findBySrcDestId(sourceUserId, targetUserId) {
		if (sourceUserId == null || targetUserId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.find('userFollowings', { source: sourceUserId, target: targetUserId });
	}

	async findTargets(sourceUserId, limit) {
		if (sourceUserId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.findArray('userFollowings', { source: sourceUserId }, false, limit);
	}

	async findSources(targetUserId, limit) {
		if (targetUserId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.findArray('userFollowings', { target: targetUserId }, false, limit);
	}
}
module.exports = UserFollowingsService;
