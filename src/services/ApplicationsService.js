const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidArgumentError, InvalidOperationError } = require('../modules/errors');

class ApplicationsService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository, config) {
		this._repository = repository;
		this._config = config;
	}

	create(name, creator, description, permissions) {
		return this._repository.create('applications', {
			name: name,
			creatorId: creator.document._id,
			description: description,
			permissions: permissions
		});
	}

	findByName(name) {
		if (name == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.find('applications', { name });
	}

	findArrayByCreatorId(creatorId) {
		if (creatorId == null) {
			throw new MissingArgumentsError();
		}

		return this._repository.findArray('applications', { creatorId });
	}

	splitKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);
		if (reg == null) {
			throw new InvalidArgumentError('key');
		}

		return {
			applicationId: MongoAdapter.buildId(reg[1]),
			hash: reg[2],
			keyCode: parseInt(reg[3])
		};
	}

	async verifyKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		let elements;
		try {
			elements = this.splitKey(key);
		}
		catch (err) {
			return false;
		}
		const { applicationId, hash, keyCode } = elements;

		const application = await this._repository.find('applications', { _id: applicationId, keyCode });
		if (application == null) {
			return false;
		}

		const correctHash = buildHash(`${this._config.api.secretToken.application}/${application.document.creatorId}/${applicationId}/${keyCode}`);
		const isPassed = hash === correctHash && keyCode === application.document.keyCode;

		return isPassed;
	}

	hasPermission(applicationDocument, permissionName) {
		if (applicationDocument == null || permissionName == null) {
			throw new MissingArgumentsError();
		}

		return applicationDocument.permissions.indexOf(permissionName) != -1;
	}

	async generateApplicationKey(applicationDocument) {
		if (applicationDocument != null) {
			throw new MissingArgumentsError();
		}

		const undatedDocument = await this._repository.updateById('applications', applicationDocument._id.toString(), { keyCode: randomRange(1, 99999) });
		const key = this.getApplicationKey(undatedDocument);

		return key;
	}

	getApplicationKey(applicationDocument) {
		if (applicationDocument != null) {
			throw new MissingArgumentsError();
		}
		if (applicationDocument.keyCode == null) {
			throw new InvalidOperationError('keyCode is empty');
		}

		const hash = buildHash(`${this.config.api.secretToken.application}/${applicationDocument.creatorId}/${applicationDocument._id}/${applicationDocument.keyCode}`);
		const key = `${applicationDocument._id}-${hash}.${applicationDocument.keyCode}`;

		return key;
	}

	serialize(applicationDocument) {
		if (applicationDocument != null) {
			throw new MissingArgumentsError();
		}

		const res = Object.assign({}, applicationDocument);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		res._id = undefined;

		// creatorId
		res.creatorId = res.creatorId.toString();

		// keyCode
		res.keyCode = undefined;

		return sortObject(res);
	}
}
module.exports = ApplicationsService;
