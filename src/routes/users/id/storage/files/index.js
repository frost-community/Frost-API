'use strict';

const ApiResult = require('../../../../../helpers/apiResult');
const User = require('../../../../../documentModels/user');
const getFileType = require('file-type');
const validator = require('validator');

const supportedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

// 新規作成
exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'fileData', type: 'string'}
			// accessRight.level
		],
		permissions: ['storageWrite']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user as premise not found');
	}

	// 所有していないリソース
	if (!user.document._id.equals(request.user.document._id)) {
		return new ApiResult(403, 'access denied');
	}

	let accessRightLevel = 'public'; // TODO: public 以外のアクセス権タイプのサポート

	const fileData = request.body.fileData;

	if (!validator.isBase64(fileData)) {
		return new ApiResult(400, 'file is not base64 format');
	}

	const fileDataBuffer = Buffer.from(fileData, 'base64');

	// データ形式を取得
	const fileType = getFileType(fileDataBuffer);

	// サポートされているデータ形式か
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		return new ApiResult(400, 'file is not supported format');
	}

	// file
	let file;
	try {
		file = await request.db.storageFiles.createAsync(
			'user',
			request.user.document._id,
			fileDataBuffer,
			fileType.mime,
			accessRightLevel);
	}
	catch(err) {
		console.log(err);
	}

	if (file == null) {
		return new ApiResult(500, 'failed to create storage file');
	}

	return new ApiResult(200, {storageFile: file.serialize(true)});
};

// ファイル一覧取得 // TODO: フィルター指定、ページネーション、ファイル内容を含めるかどうか
exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [
		],
		permissions: ['storageRead']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user as premise not found');
	}

	// 所有していないリソース
	if (!user.document._id.equals(request.user.document._id)) {
		return new ApiResult(403, 'access denied');
	}

	// files
	let files;
	try {
		files = await request.db.storageFiles.findByCreatorArrayAsync(
			'user',
			request.user.document._id);
	}
	catch(err) {
		console.log(err);
	}

	if (files == null || files.length == 0) {
		return new ApiResult(204);
	}

	return new ApiResult(200, {storageFiles: files.map(i => i.serialize(true))});
};
