'use strict';

//const postModelAsync = require('../models/post');
const posts = require('../helpers/collections').posts;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	instance.collection = await posts(config);
	//const postModel = await postModelAsync(config);

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
