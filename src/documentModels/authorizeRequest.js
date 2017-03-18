'use strict';

const AuthorizeRequestModel = require('../models/authorizeRequest').AuthorizeRequestModel;
const randomRange = require('../helpers/randomRange');

class AuthorizeRequest {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.authorizeRequestModel = AuthorizeRequestModel(db, config);
	}

	getVerificationCodeAsync = async () => {
		let verificationCode = '';
		for (let i = 0; i < 6; i++)
			verificationCode += String(randomRange(0, 9));

		await this.db.authorizeRequests.updateAsync({_id: this.document._id}, {verificationCode: verificationCode});

		return verificationCode;
	}

	getRequestKeyAsync = async () => {
		if (this.document.keyCode == null) {
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			const cmdResult = await this.db.authorizeRequests.updateIdAsync(this.document._id, {keyCode: keyCode});
			await this.fetchAsync();
		}

		return this.authorizeRequestModel.buildKey(this.document._id, this.document.applicationId, this.document.keyCode);
	}

	serialize = () => {
		const res = {};
		Object.assign(res, this.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	}

	// 最新の情報を取得して同期する
	fetchAsync = async () => {
		this.document = (await this.db.authorizeRequests.findIdAsync(this.document._id)).document;
	}
}
exports.AuthorizeRequest = AuthorizeRequest;
