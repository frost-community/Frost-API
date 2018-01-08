const CollectionBase = require('../modules/collectionBase');
const { MissingArgumentsError, InvalidArgumentError } = require('../modules/errors');

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

		return super.createAsync(data);
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
