'use strict';

const CollectionBase = require('../helpers/collectionBase');
const { MissingArgumentsError, InvalidArgumentError } = require('../helpers/errors');

const accessRightLevels = [
	'public',
	'specific',
	'private'
];

class StorageFiles extends CollectionBase {
	constructor(db, config) {
		super('storageFiles', '../documentModels/storageFile', db, config);
	}

	createAsync(creatorType, creatorId, fileDataBuffer, mimeType, accessRightLevel, accessRightTargets) {
		if (creatorType == null || creatorId == null || fileDataBuffer == null || mimeType == null)
			throw new MissingArgumentsError();

		accessRightLevel = (accessRightLevel != null) ? accessRightLevel : 'public';

		if (!accessRightLevels.some(accessRightLevel)) {
			throw new InvalidArgumentError('accessRightLevel');
		}

		accessRightTargets = (accessRightTargets != null && accessRightLevel == 'specific') ? accessRightTargets : undefined;

		return super.createAsync({
			creator: {
				type: creatorType,
				id: creatorId
			},
			fileData: fileDataBuffer,
			type: mimeType.split('/')[0],
			mimeType: mimeType,
			accessRight: {
				level: accessRightLevel,
				targets: accessRightTargets
			}
		});
	}

	findByCreatorArrayAsync(creatorType, creatorId) {
		return super.findArrayAsync({
			creator: {
				type: creatorType,
				id: creatorId
			}
		});
	}
}
module.exports = StorageFiles;
