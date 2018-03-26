const ApiContext = require('../../../../../modules/ApiContext');
const MongoAdapter = require('../../../../../modules/MongoAdapter');
const validator = require('validator');
const $ = require('cafy').default;
const { getUsedSpace } = require('../../../../../modules/helpers/UserStorageHelper');
const { ApplicationError } = require('../../../../../modules/errors');
const getFileType = require('file-type');

const supportedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

/**
 * create a storage file
 *
 * @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			fileData: { cafy: $().string().pipe(i => validator.isBase64(i)) },
			accessRight: {
				cafy: $().object()
					.have('level', $().string().or('public|private'))
					.prop('users', $().array('string').unique().each(i => MongoAdapter.validateId(i))), default: { level: 'public' }
			}
		},
		scopes: ['storageWrite']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	const accessRight = apiContext.body.accessRight;

	// file data
	const fileDataBuffer = Buffer.from(apiContext.body.fileData, 'base64');

	// file type
	const fileType = getFileType(fileDataBuffer);
	if (fileType == null || !supportedMimeTypes.some(i => i == fileType.mime)) {
		apiContext.response(400, 'file is not supported format');
		return;
	}

	let file;
	await apiContext.lock.acquire(`storageFiles/${user._id.toString()}`, async () => {
		// calculate available space
		const usedSpace = await getUsedSpace(user._id, apiContext.storageFilesService);
		if (apiContext.config.api.storage.spaceSize - usedSpace - fileDataBuffer.length < 0) {
			apiContext.response(400, 'storage space is full');
			return;
		}

		// create a document
		try {
			file = await apiContext.storageFilesService.create('user', apiContext.user._id, fileDataBuffer, fileType.mime, accessRight);
		}
		catch (err) {
			if (err instanceof ApplicationError) {
				apiContext.response(400, err.message);
				return;
			}
			throw err;
		}
	});
	if (apiContext.responsed) {
		return;
	}

	if (file == null) {
		apiContext.response(500, 'failed to create storage file');
		return;
	}

	apiContext.response(200, { storageFile: apiContext.storageFilesService.serialize(file, true) });
};

/**
 * fetch a list of files
 *
 * @param {ApiContext} apiContext */
exports.get = async (apiContext) => { // TODO: フィルター指定
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => validator.isInt(i, { min: 0, max: 100 })), default: '30' },
			next: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			includeFileData: { cafy: $().string().pipe(i => validator.isBoolean(i)), default: 'false' }
		},
		scopes: ['storage.read']
	});
	if (apiContext.responsed) return;

	// convert query value
	const limit = validator.toInt(apiContext.query.limit);
	const next = apiContext.query.next != null ? MongoAdapter.buildId(apiContext.query.next) : null;
	const includeFileData = validator.toBoolean(apiContext.query.includeFileData);

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// fetch document
	const files = await apiContext.storageFilesService.findArrayByCreator('user', apiContext.user._id, { limit, since: next });
	if (files.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, {
		storageFiles: files.map(i => apiContext.storageFilesService.serialize(i, includeFileData)),
		next: files[files.length-1]._id
	});
};
