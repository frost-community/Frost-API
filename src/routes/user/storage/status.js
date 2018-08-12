const ApiContext = require('../../../modules/ApiContext');
const { getUsedSpace } = require('../../../modules/helpers/UserStorageHelper');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['storage.read']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	const isOwned = user._id.equals(apiContext.user._id);
	if (!isOwned) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	const usedSpace = await getUsedSpace(user._id, apiContext.storageFilesService);
	const availableSpace = apiContext.config.storage.spaceSize - usedSpace;

	apiContext.response(200, {
		storage: {
			spaceSize: apiContext.config.storage.spaceSize,
			usedSpace: usedSpace,
			availableSpace: availableSpace
		}
	});
};
