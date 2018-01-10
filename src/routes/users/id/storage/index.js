const ApiContext = require('../../../../modules/ApiContext');
const { getUsedSpace } = require('../../../../modules/helpers/UserStorageHelper');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['storageRead']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const isOwned = user._id.equals(apiContext.user._id);
	if (!isOwned) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	const usedSpace = await getUsedSpace(user._id, apiContext.repository);
	const availableSpace = apiContext.config.api.storage.spaceSize - usedSpace;

	apiContext.response(200, {
		storage: {
			spaceSize: apiContext.config.api.storage.spaceSize,
			usedSpace: usedSpace,
			availableSpace: availableSpace
		}
	});
};
