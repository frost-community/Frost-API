'use strict';

// const userFollowingModelAsync = require('../models/userFollowing');
const userFollowingsAsync = require('../helpers/collections').userFollowings;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	const userFollowings = await userFollowingsAsync(config);
	//const userFollowingModel = await userFollowingModelAsync(config);

	// TODO: 各種操作用メソッドの追加

	instance.serialize = () => {
		const res = {};
		Object.assign(res, instance.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	};

	// 最新の情報を取得して同期する
	instance.sync = async () => {
		instance.document = (await userFollowings.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
