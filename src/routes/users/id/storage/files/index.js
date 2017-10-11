'use strict';

const ApiResult = require('../../../../../helpers/apiResult');
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
			{name: 'file', type: 'string'}
		],
		permissions: ['storageWrite']
	});

	if (result != null) {
		return result;
	}

	const file = request.body.file;

	if (!validator.isBase64(file)) {
		return new ApiResult(400, 'file is not base64 format');
	}

	const fileDataBuffer = Buffer.from(file, 'base64');

	// データ形式を取得
	const fileType = getFileType(fileDataBuffer);

	// サポートされているデータ形式か
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		return new ApiResult(400, 'file is not supported format');
	}

	let storageFile;

	try {
		storageFile = await request.db.storageFiles.createAsync({ // TODO: move to document models
			creator: {
				type: 'user',
				id: request.user.document._id
			},
			type: fileType.mime.split('/')[0],
			mimeType: fileType.mime,
			data: fileDataBuffer,
			accessRight: {
				level: 'public', // 'specific' 'private'
				// users: []
			}
		});
	}
	catch(err) {
		console.log(err.trace);
	}

	if (storageFile == null) {
		return new ApiResult(500, 'failed to create storage file');
	}

	return new ApiResult(200, {storageFile: storageFile.serialize()});
};

// ファイル一覧取得 // TODO: フィルター指定
exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [
		],
		permissions: ['storageRead']
	});

	if (result != null) {
		return result;
	}

	let files;
	try {
		files = await request.db.storageFiles.findArrayAsync(request.user.document._id);
	}
	catch(err) {
		// noop
	}

	if (files == null || files.length == 0) {
		return new ApiResult(204);
	}

	return new ApiResult(200, {storageFiles: files.map(i => i.serialize())});
};
