const moment = require('moment');
const { ObjectId } = require('mongodb');
const MongoAdapter = require('../modules/MongoAdapter');
const { buildHash, sortObject, randomRange } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidOperationError, InvalidArgumentError } = require('../modules/errors');

class AuthorizeRequestsService {
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
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	*/
	async generateVerificationCode(document) {
		if (document == null)
			throw new MissingArgumentsError();

		let verificationCode = '';
		for (let i = 0; i < 6; i++) {
			verificationCode += randomRange(0, 9);
		}
		const updated = await this._repository.update('authorizeRequests', { _id: document._id }, { verificationCode });

		return this.getVerificationCode(updated);
	}

	/**
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	*/
	getVerificationCode(document) {
		if (document == null)
			throw new MissingArgumentsError();

		if (document.verificationCode == null)
			throw new InvalidOperationError('verificationCode is empty');

		return document.verificationCode;
	}

	/**
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	*/
	async generateIceAuthKey(document) {
		if (document == null)
			throw new MissingArgumentsError();

		const keyCode = randomRange(1, 99999);
		const updated = await this._repository.updateById('authorizeRequests', document._id, { keyCode });

		return this.getIceAuthKey(updated);
	}

	/**
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	*/
	getIceAuthKey(document) {
		if (document == null)
			throw new MissingArgumentsError();

		if (document.keyCode == null)
			throw new InvalidOperationError('keyCode is empty');

		const hash = buildHash(`${this._config.api.secretToken.authorizeRequest}/${document.applicationId}/${document._id}/${document.keyCode}`);

		return `${document._id}-${hash}.${document.keyCode}`;
	}

	/**
	 * 認可の対象とするユーザーを設定し、更新したドキュメントを返します
	 *
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	 * @param {String | ObjectId} userId 対象とするUserドキュメントのId
	 * @returns {Promise<AuthorizeRequestDocument>} 再生成された更新後のドキュメントオブジェクト
	*/
	setTargetUserId(document, userId) {
		if (document == null || userId == null)
			throw new MissingArgumentsError();

		return this._repository.updateById('authorizeRequests', document._id, { targetUserId: MongoAdapter.buildId(userId) });
	}

	/**
	 * @param {AuthorizeRequestDocument} document AuthorizeRequestドキュメント
	*/
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

	/**
	 * @param {ObjectId} applicationId
	 * @returns {Promise<AuthorizeRequestDocument>}
	*/
	create(applicationId) {
		if (applicationId == null)
			throw new MissingArgumentsError();

		return this._repository.create('authorizeRequests', { applicationId });
	}

	splitIceAuthKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null) {
			throw new InvalidArgumentError('key');
		}

		return { authorizeRequestId: MongoAdapter.buildId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3]) };
	}

	async verifyIceAuthKey(key) {
		if (key == null) {
			throw new MissingArgumentsError();
		}

		const { authorizeRequestId, hash, keyCode } = this.splitIceAuthKey(key);
		const authorizeRequest = await this._repository.findById('authorizeRequests', authorizeRequestId);
		if (authorizeRequest == null) {
			console.log('authorizeRequest is not exists.');
			return false;
		}

		const correctHash = buildHash(`${this._config.api.secretToken.authorizeRequest}/${authorizeRequest.applicationId}/${authorizeRequestId}/${keyCode}`);
		// const createdAt = moment(authorizeRequest._id.getTimestamp());
		const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < this._config.api.iceAuthKeyExpireSec;
		const isPassed = isAvailabilityPeriod && hash === correctHash && keyCode === authorizeRequest.keyCode;

		return isPassed;
	}
}
module.exports = AuthorizeRequestsService;
