const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');

class UserFollowingsService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		if (repository == null || config == null)
			throw new MissingArgumentsError();

		this._repository = repository;
		this._config = config;
	}

	serialize(document) {
		if (document == null)
			throw new MissingArgumentsError();

		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		return sortObject(res);
	}

	// helpers

	async create(sourceUserId, targetUserId, message) {
		if (sourceUserId == null || targetUserId == null)
			throw new MissingArgumentsError();

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
		if (sourceUserId == null || targetUserId == null)
			throw new MissingArgumentsError();

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

		return this._repository.findArray('userFollowings', { source: sourceUserId }, { isAscending: false, limit });
	}

	async findSources(targetUserId, limit) {
		if (targetUserId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.findArray('userFollowings', { target: targetUserId }, { isAscending: false, limit });
	}
}
module.exports = UserFollowingsService;
