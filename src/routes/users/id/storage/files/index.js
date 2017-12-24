const User = require('../../../../../documentModels/user');
const { getUsedSpace } = require('../../../../../helpers/UserStorageHelpers');
const getFileType = require('file-type');
const validator = require('validator');
const $ = require('cafy').default;
const { ApiError } = require('../../../../../helpers/errors');

const supportedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

// create a storage file
exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			fileData: { cafy: $().string().pipe(i => validator.isBase64(i)) }
			// accessRight.level
		},
		permissions: ['storageWrite']
	});

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		throw new ApiError(404, 'user as premise not found');
	}

	const isOwnerAccess = user.document._id.equals(apiContext.user.document._id);
	if (!isOwnerAccess) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	let accessRightLevel = 'public'; // TODO: public 以外のアクセス権タイプのサポート

	// file data
	const fileDataBuffer = Buffer.from(apiContext.body.fileData, 'base64');

	// file type
	const fileType = getFileType(fileDataBuffer);
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		throw new ApiError(400, 'file is not supported format');
	}

	let file;

	await apiContext.lock.acquire(user.document._id.toString(), async () => {
		// calculate available space
		const usedSpace = await getUsedSpace(user.document._id, apiContext.db);
		if (apiContext.config.api.storage.spaceSize - usedSpace - fileDataBuffer.length < 0) {
			throw new ApiError(400, 'storage space is full');
		}

		// create a document
		try {
			file = await apiContext.db.storageFiles.createAsync(
				'user',
				apiContext.user.document._id,
				fileDataBuffer,
				fileType.mime,
				accessRightLevel);
		}
		catch (err) {
			console.log(err);
		}
	});
	if (apiContext.responsed) {
		return;
	}

	if (file == null) {
		throw new ApiError(500, 'failed to create storage file');
	}

	apiContext.response(200, { storageFile: file.serialize(true) });
};

// fetch a list of files
exports.get = async (apiContext) => { // TODO: フィルター指定、ページネーション、ファイル内容を含めるかどうか
	await apiContext.check({
		query: {},
		permissions: ['storageRead']
	});

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		throw new ApiError(404, 'user as premise not found');
	}

	const isOwnerAccess = user.document._id.equals(apiContext.user.document._id);
	if (!isOwnerAccess) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	// fetch document
	let files;
	try {
		files = await apiContext.db.storageFiles.findByCreatorArrayAsync(
			'user',
			apiContext.user.document._id);
	}
	catch (err) {
		console.log(err);
	}

	if (files == null || files.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { storageFiles: files.map(i => i.serialize(true)) });
};
