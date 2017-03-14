'use strict';

// const userFollowingModelAsync = require('../models/userFollowing');
const userFollowings = require('../helpers/collections').userFollowings;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	instance.collection = await userFollowings(config);
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

	return instance;
};
