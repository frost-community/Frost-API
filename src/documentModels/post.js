'use strict';

//const postModelAsync = require('../models/post');
const posts = require('../helpers/collections').posts;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await posts(config);
	//const postModel = await postModelAsync(config);

	// TODO: 各種操作用メソッドの追加

	return instance;
};
