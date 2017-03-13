'use strict';

// const userFollowingModelAsync = require('../models/userFollowing');
const userFollowings = require('../helpers/collections').userFollowings;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await userFollowings(config);
	//const userFollowingModel = await userFollowingModelAsync(config);

	// TODO: 各種操作用メソッドの追加

	return instance;
};
