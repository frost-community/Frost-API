'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');

const spaceSize = 128 * 1024 * 1024; // 128MB

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
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

	// files
	let files;
	try {
		files = await request.db.storageFiles.findArrayAsync({
			creator: {
				type: 'user',
				id: user.document._id
			}
		});
	}
	catch(err) {
		console.log(err);
	}

	let totalSize = 0;
	for (const file of files) {
		totalSize += file.document.fileData.length();
	}

	return new ApiResult(200, {
		storage: {
			spaceSize: spaceSize,
			usedSpace: totalSize,
			availableSpace: spaceSize - totalSize
		}
	});
};
