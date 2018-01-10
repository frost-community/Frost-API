const ApiContext = require('../../../../../modules/ApiContext');
const { getUsedSpace } = require('../../../../../modules/helpers/UserStorageHelper');
const getFileType = require('file-type');
const validator = require('validator');
const $ = require('cafy').default;

const supportedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

// create a storage file
/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			fileData: { cafy: $().string().pipe(i => validator.isBase64(i)) }
			// accessRight.level
		},
		permissions: ['storageWrite']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	let accessRightLevel = 'public'; // TODO: public 以外のアクセス権タイプのサポート

	// file data
	const fileDataBuffer = Buffer.from(apiContext.body.fileData, 'base64');

	// file type
	const fileType = getFileType(fileDataBuffer);
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		return apiContext.response(400, 'file is not supported format');
	}

	let file;

	await apiContext.lock.acquire(user._id.toString(), async () => {
		// calculate available space
		const usedSpace = await getUsedSpace(user._id, apiContext.db);
		if (apiContext.config.api.storage.spaceSize - usedSpace - fileDataBuffer.length < 0) {
			return apiContext.response(400, 'storage space is full');
		}

		// create a document
		file = await apiContext.storageFilesService.create('user', apiContext.user._id, fileDataBuffer, fileType.mime, accessRightLevel);
	});
	if (apiContext.responsed) {
		return;
	}

	if (file == null) {
		return apiContext.response(500, 'failed to create storage file');
	}

	apiContext.response(200, { storageFile: apiContext.storageFilesService.serialize(file, true) });
};

// fetch a list of files
/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => { // TODO: フィルター指定、ページネーション、ファイル内容を含めるかどうか
	await apiContext.proceed({
		query: {},
		permissions: ['storageRead']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// fetch document
	const files = await apiContext.storageFilesService.findArrayByCreator('user', apiContext.user._id);
	if (files.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { storageFiles: files.map(i => apiContext.storageFilesService.serialize(i, true)) });
};
