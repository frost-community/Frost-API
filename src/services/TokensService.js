//const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError } = require('../modules/errors');
const uid = require('uid2');

class TokensService {
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
		//res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		//res.id = res._id.toString();
		delete res._id;

		// applicationId
		res.applicationId = res.applicationId.toString();

		// userId
		res.userId = res.userId.toString();

		return sortObject(res);
	}

	// helpers

	create(application, user, scopes, options) {
		options = options || {};
		if (application == null || user == null || scopes == null)
			throw new MissingArgumentsError();

		const data = {
			applicationId: application._id,
			userId: user._id,
			scopes: scopes,
			accessToken: uid(128)
		};

		if (options.host) {
			data.host = true;
		}

		return this._repository.create('tokens', data);
	}

	find(applicationId, userId, scopes) {
		if (applicationId == null || userId == null || scopes == null)
			throw new MissingArgumentsError();

		applicationId = MongoAdapter.buildId(applicationId);
		userId = MongoAdapter.buildId(userId);

		const scopesQuery = { $size: scopes.length };
		// NOTE: 空の配列を$allに指定すると検索にヒットしなくなるので、空のときは$allを指定しない
		if (scopes.length != 0) {
			scopesQuery.$all = scopes;
		}

		return this._repository.find('tokens', { applicationId, userId, scopes: scopesQuery });
	}

	findByAccessToken(accessToken) {
		if (accessToken == null)
			throw new MissingArgumentsError();

		return this._repository.find('tokens', { accessToken });
	}
}
module.exports = TokensService;
