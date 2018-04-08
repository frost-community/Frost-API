const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidOperationError } = require('../modules/errors');
const definedScopes = require('../modules/scopes');
const uid = require('uid2');

class ApplicationsService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		if (repository == null || config == null)
			throw new MissingArgumentsError();

		this._repository = repository;
		this._config = config;
	}

	hasScope(document, scopeName) {
		if (document == null || scopeName == null) {
			throw new MissingArgumentsError();
		}

		return document.scopes.indexOf(scopeName) != -1;
	}

	async generateApplicationSecret(document) {
		if (document == null) {
			throw new MissingArgumentsError();
		}

		const seed = uid(8);
		const updatedDocument = await this._repository.updateById('applications', document._id.toString(), { seed });
		const secret = this.getApplicationSecret(updatedDocument);

		return secret;
	}

	getApplicationSecret(document) {
		if (document == null) {
			throw new MissingArgumentsError();
		}
		if (!this.existApplicationSecret(document)) {
			throw new InvalidOperationError('seed is empty');
		}

		const secret = buildHash(`${this._config.api.secretToken.application}/${document._id}/${document.seed}`);

		return secret;
	}

	existApplicationSecret(document) {
		if (document == null) {
			throw new MissingArgumentsError();
		}

		return document.seed != null;
	}

	serialize(document, includeSeed = false) {
		if (document == null)
			throw new MissingArgumentsError();

		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// creatorId
		res.creatorId = res.creatorId.toString();

		// seed
		if (!includeSeed) {
			delete res.seed;
		}

		return sortObject(res);
	}

	// helpers

	create(name, creator, description, scopes, options) {
		options = options || {};
		if (name == null || creator == null || description == null || scopes == null)
			throw new MissingArgumentsError();

		const data = {
			name,
			creatorId: creator._id,
			description,
			scopes
		};

		if (options.root) {
			data.root = true;
		}

		return this._repository.create('applications', data);
	}

	findByName(name) {
		if (name == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.find('applications', { name });
	}

	/**
	 * @param {{isAscending: Boolean, limit: Number, since: ObjectId, until: ObjectId}} options
	*/
	findArrayByCreatorId(creatorId, options) {
		if (creatorId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.findArray('applications', { creatorId }, options);
	}

	async nonDuplicatedName(name) {
		if (name == null)
			throw new MissingArgumentsError();

		return (await this.findByName(name)) == null;
	}

	availableScope(scopeName) {
		if (scopeName == null)
			throw new MissingArgumentsError();

		const definedScope = definedScopes.find(i => i.name == scopeName);
		const available = definedScope != null && definedScope.grantable;

		return available;
	}
}
module.exports = ApplicationsService;
