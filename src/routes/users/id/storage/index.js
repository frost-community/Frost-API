'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');
const getUsedSpace = require('../../../../helpers/getUsedSpaceUserStorageAsync');

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

	const isOwned = user.document._id.equals(request.user.document._id);
	if (!isOwned) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	const usedSpace = await getUsedSpace(user.document._id, request.db);
	const availableSpace = request.config.api.storage.spaceSize - usedSpace;

	return new ApiResult(200, {
		storage: {
			spaceSize: request.config.api.storage.spaceSize,
			usedSpace: usedSpace,
			availableSpace: availableSpace
		}
	});
};
