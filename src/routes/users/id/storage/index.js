const User = require('../../../../documentModels/user');
const { getUsedSpace } = require('../../../../helpers/UserStorageHelpers');
// const $ = require('cafy').default;
const { ApiError } = require('../../../../helpers/errors');

exports.get = async (apiContext) => {
	await apiContext.check({
		permissions: ['storageRead']
	});

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		throw new ApiError(404, 'user as premise not found');
	}

	const isOwned = user.document._id.equals(apiContext.user.document._id);
	if (!isOwned) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	const usedSpace = await getUsedSpace(user.document._id, apiContext.db);
	const availableSpace = apiContext.config.api.storage.spaceSize - usedSpace;

	apiContext.response(200, {
		storage: {
			spaceSize: apiContext.config.api.storage.spaceSize,
			usedSpace: usedSpace,
			availableSpace: availableSpace
		}
	});
};
