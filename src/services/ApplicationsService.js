const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidArgumentError, InvalidOperationError } = require('../modules/errors');
const definedScopes = require('../modules/scopes');

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

		const seed = randomRange(1, 99999);
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

	create(name, creator, description, scopes) {
		if (name == null || creator == null || description == null || scopes == null)
			throw new MissingArgumentsError();

		return this._repository.create('applications', {
			name,
			creatorId: creator._id,
			description,
			scopes
		});
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

	async verifyApplicationSecret(applicationId, secret) {
		if (applicationId == null || secret == null) {
			throw new MissingArgumentsError();
		}

		const application = await this._repository.findById('applications', applicationId);
		if (application == null) {
			throw new InvalidArgumentError();
		}

		if (!this.existApplicationSecret(application)) {
			return false;
		}

		return this.getApplicationSecret(application) == secret;
	}

	async nonDuplicatedName(name) {
		if (name == null)
			throw new MissingArgumentsError();

		return (await this.findByName(name)) == null;
	}

	availableScopes(scopeNames) {
		if (scopeNames == null)
			throw new MissingArgumentsError();

		return scopeNames.every(scopeName => {
			const scope = definedScopes.find(definedScope => definedScope.name == scopeName);
			return scope != null && scope.grantable;
		});
	}
}
module.exports = ApplicationsService;
