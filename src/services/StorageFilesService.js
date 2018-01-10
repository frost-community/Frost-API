const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidArgumentError } = require('../modules/errors');

const accessRightLevels = [
	'public',
	'specific',
	'private'
];

class StorageFilesService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository) {
		this._repository = repository;
	}

	serialize(document, includeFileData) {
		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		res._id = undefined;

		// creator.id
		res.creator.id = res.creator.id.toString();

		// size
		res.size = res.fileData.length();

		// fileData
		res.fileData = res.fileData.toString('base64');

		// exclude fileData
		if (!includeFileData) {
			res.fileData = undefined;
		}

		return sortObject(res);
	}

	// helpers

	create(creatorType, creatorId, fileDataBuffer, mimeType, accessRightLevel, accessRightTargets) {
		if (creatorType == null || creatorId == null || fileDataBuffer == null || mimeType == null) {
			throw new MissingArgumentsError();
		}

		accessRightLevel = (accessRightLevel != null) ? accessRightLevel : 'public';

		if (!accessRightLevels.some(level => level == accessRightLevel)) {
			throw new InvalidArgumentError('accessRightLevel');
		}

		const data = {
			creator: {
				type: creatorType,
				id: creatorId
			},
			fileData: fileDataBuffer,
			type: mimeType.split('/')[0],
			mimeType: mimeType,
			accessRight: {
				level: accessRightLevel
			}
		};

		if (accessRightTargets != null && accessRightLevel == 'specific') {
			data.targets = accessRightTargets;
		}

		return this._repository.create('storageFiles', data);
	}

	findArrayByCreator(creatorType, creatorId, sortOption, limit) {
		const query = {
			creator: {
				type: creatorType,
				id: creatorId
			}
		};

		return this._repository.findArray('storageFiles', query, sortOption, limit);
	}
}
module.exports = StorageFilesService;
