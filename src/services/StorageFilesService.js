const moment = require('moment');
const MongoAdapter = require('../modules/MongoAdapter');
const { sortObject } = require('../modules/helpers/GeneralHelper');
const { MissingArgumentsError, InvalidArgumentError, ApplicationError } = require('../modules/errors');

const accessRightLevels = [
	'public',
	'private'
];

class StorageFilesService {
	/**
	 * @param {MongoAdapter} repository
	*/
	constructor(repository) {
		if (repository == null)
			throw new MissingArgumentsError();

		this._repository = repository;
	}

	serialize(document, includeFileData) {
		if (document == null || includeFileData == null)
			throw new MissingArgumentsError();

		const res = Object.assign({}, document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// creator.id
		res.creator.id = res.creator.id.toString();

		// size
		res.size = res.fileData.length();

		// fileData
		if (includeFileData) {
			res.fileData = res.fileData.toString('base64');
		}
		else {
			delete res.fileData;
		}

		return sortObject(res);
	}

	// helpers

	/**
	 * @param {string} creatorType
	 * @param {ObjectId} creatorId
	 * @param {Buffer} fileDataBuffer
	 * @param {string} mimeType
	 * @param {{level: string, users: string[]}} accessRight
	*/
	async create(creatorType, creatorId, fileDataBuffer, mimeType, accessRight) {
		if (creatorType == null || creatorId == null || fileDataBuffer == null || mimeType == null || accessRight == null) {
			throw new MissingArgumentsError();
		}

		if (accessRightLevels.indexOf(accessRight.level) == -1) {
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
				level: accessRight.level
			}
		};

		if (accessRight.level == 'private') {
			if (accessRight.users != null) {
				// check format ObjectId source
				if (!accessRight.users.every(userId => MongoAdapter.validateId(userId))) {
					throw new ApplicationError('some accessRight.users are invalid format');
				}
				// build ObjectId
				const userIds = accessRight.users.map(userId => MongoAdapter.buildId(userId));

				// check existing all users
				const userCount = await this._repository.count('users', { _id: { $in: userIds } });
				if (userCount != userIds.length) {
					throw new ApplicationError('some accessRight.users are invalid value');
				}

				data.accessRight.users = userIds;
			}
		}

		return this._repository.create('storageFiles', data);
	}

	findArrayByCreator(creatorType, creatorId, isAscending, limit) {
		if (creatorType == null || creatorId == null)
			throw new MissingArgumentsError();

		const query = {
			creator: {
				type: creatorType,
				id: creatorId
			}
		};

		return this._repository.findArray('storageFiles', query, { isAscending, limit });
	}
}
module.exports = StorageFilesService;
