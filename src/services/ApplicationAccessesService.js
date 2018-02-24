const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidArgumentError, InvalidOperationError } = require('../modules/errors');

class ApplicationAccessesService {
	/**
	 * @param {MongoAdapter} repository
	 * @param {Object} config
	*/
	constructor(repository, config) {
		if (repository == null || config == null)
			throw new MissingArgumentsError();

		this._repository = repository;
		this._config = config;
	}

	async generateAccessKey(document) {
		if (document == null)
			throw new MissingArgumentsError();

		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await this._repository.find('applicationAccesses', { userId: document.userId, keyCode }) != null;
		}
		while (isExist && tryCount < 4);

		if (isExist && tryCount >= 4) {
			throw new Error('the number of trials for keyCode generation has reached its upper limit');
		}

		const updatedDocument = await this._repository.updateById('applicationAccesses', document._id, { keyCode });
		const key = this.getAccessKey(updatedDocument);

		return key;
	}

	getAccessKey(document) {
		if (document == null)
			throw new MissingArgumentsError();

		if (document.keyCode == null)
			throw new InvalidOperationError('keyCode is empty');

		const hash = buildHash(`${this._config.api.secretToken.applicationAccess}/${document.applicationId}/${document.userId}/${document.keyCode}`);

		return `${document.userId}-${hash}.${document.keyCode}`;
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

		// keyCode
		delete res.keyCode;

		return sortObject(res);
	}

	// helpers

	create(applicationId, targetUserId) {
		if (applicationId == null || targetUserId == null)
			throw new MissingArgumentsError();

		return this._repository.create('applicationAccesses', {
			applicationId,
			userId: targetUserId,
			keyCode: null
		});
	}

	buildHash(applicationId, userId, keyCode) {
		if (applicationId == null || userId == null || keyCode == null) {
			throw new MissingArgumentsError();
		}

		return buildHash(`${this._config.api.secretToken.applicationAccess}/${applicationId}/${userId}/${keyCode}`);
	}

	splitAccessKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null) {
			throw new InvalidArgumentError('key');
		}

		return { userId: MongoAdapter.buildId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3]) };
	}

	async verifyAccessKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		const { userId, hash, keyCode } = this.splitAccessKey(key);
		const applicationAccess = await this._repository.find('applicationAccesses', { userId, keyCode });
		if (applicationAccess == null) {
			return false;
		}

		const correctHash = buildHash(`${this._config.api.secretToken.applicationAccess}/${applicationAccess.applicationId}/${userId}/${keyCode}`);
		const isPassed = (hash === correctHash && keyCode === applicationAccess.keyCode);

		return isPassed;
	}
}
module.exports = ApplicationAccessesService;
