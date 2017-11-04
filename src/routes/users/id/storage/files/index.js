'use strict';

const ApiResult = require('../../../../../helpers/apiResult');
const User = require('../../../../../documentModels/user');
const getUsedSpace = require('../../../../../helpers/getUsedSpaceUserStorageAsync');
const getFileType = require('file-type');
const validator = require('validator');

const supportedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

// create a storage file
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

	const isOwnerAccess = user.document._id.equals(request.user.document._id);
	if (!isOwnerAccess) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	let accessRightLevel = 'public'; // TODO: public 以外のアクセス権タイプのサポート

	// file data
	if (!validator.isBase64(request.body.fileData)) {
		return new ApiResult(400, 'file is not base64 format');
	}
	const fileDataBuffer = Buffer.from(request.body.fileData, 'base64');

	// file type
	const fileType = getFileType(fileDataBuffer);
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		return new ApiResult(400, 'file is not supported format');
	}

	let file;

	const apiResult = await request.lock.acquire(user.document._id.toString(), async () => {
		// calculate available space
		const usedSpace = await getUsedSpace(user.document._id, request.db);
		if (request.config.api.storage.spaceSize - usedSpace - fileDataBuffer.length < 0) {
			return new ApiResult(400, 'storage space is full');
		}

		// create a document
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
	});
	if (apiResult) {
		return apiResult;
	}

	if (file == null) {
		return new ApiResult(500, 'failed to create storage file');
	}

	return new ApiResult(200, {storageFile: file.serialize(true)});
};

// fetch a list of files
exports.get = async (request) => { // TODO: フィルター指定、ページネーション、ファイル内容を含めるかどうか
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

	const isOwnerAccess = user.document._id.equals(request.user.document._id);
	if (!isOwnerAccess) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	// fetch document
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
