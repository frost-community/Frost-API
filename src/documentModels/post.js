'use strict';

//const postModelAsync = require('../models/post');
const postsAsync = require('../helpers/collections').posts;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	const posts = await postsAsync(config);
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

	// 最新の情報を取得して同期する
	instance.sync = async () => {
		instance.document = (await posts.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
