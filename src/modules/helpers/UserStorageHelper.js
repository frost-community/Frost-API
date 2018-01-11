const { ObjectId } = require('mongodb');
const StorageFilesService = require('../../services/StorageFilesService');

class UserStorageHelper {
	/**
	 * @param {String | ObjectId} userId
	 * @param {StorageFilesService} storageFilesService
	*/
	static async getUsedSpace(userId, storageFilesService) {
		let files;
		try {
			files = await storageFilesService.findArrayByCreator('user', userId);
		}
		catch (err) {
			console.log(err);
		}

		if (!Array.isArray(files)) {
			return 0;
		}

		let usedSpace = 0;
		for (const file of files) {
			usedSpace += file.fileData.length();
		}

		return usedSpace;
	}
}
module.exports = UserStorageHelper;
