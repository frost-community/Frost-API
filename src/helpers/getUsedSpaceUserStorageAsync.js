'use strict';

const getUsedSpaceUserStorageAsync = async (userId, db, config) => {
	let files;
	try {
		files = await db.storageFiles.findArrayAsync({
			creator: {
				type: 'user',
				id: userId
			}
		});
	}
	catch(err) {
		console.log(err);
	}

	if (!Array.isArray(files)) {
		return 0;
	}

	let usedSpace = 0;
	for (const file of files) {
		usedSpace += file.document.fileData.length();
	}

	return usedSpace;
};
module.exports = getUsedSpaceUserStorageAsync;
