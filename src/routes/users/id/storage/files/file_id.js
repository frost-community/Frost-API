const ApiContext = require('../../../../../modules/ApiContext');
// const $ = require('cafy').default;

/**
 * 対象ファイルの取得
 *
 * @param {ApiContext} apiContext
*/
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

	// file
	let file;
	try {
		file = await apiContext.repository.findById('storageFiles', apiContext.params.file_id);
	}
	catch (err) {
		console.log(err);
	}

	// ファイルが存在しているかどうか、指定ユーザーが所有するリソースであるかどうか
	if (file == null || file.creator.type != 'user' || !file.creator.id.equals(user._id)) {
		apiContext.response(404, 'file not found');
		return;
	}

	// level
	const isOwnerAccess = file.creator.id.equals(apiContext.user._id);
	let level = file.accessRight.level;
	if (level == 'private') {
		// 所有者か許可したユーザー
		const accessableUsers = file.accessRight.users;
		const isAllowedUser = isOwnerAccess || (accessableUsers != null && accessableUsers.some(i => i.equals(apiContext.user._id)));
		if (!isAllowedUser) {
			apiContext.response(403, 'this operation is not permitted');
			return;
		}
	}
	else if (level == 'public') {
		// noop
	}
	else {
		apiContext.response(500, 'unknown access-right level');
		return;
	}

	apiContext.response(200, { storageFile: apiContext.storageFilesService.serialize(file, true) });
};

/**
 * 対象ファイルの削除
 *
 * @param {ApiContext} apiContext
*/
exports.delete = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['storageWrite']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// file
	let file;
	try {
		file = await apiContext.repository.findById('storageFiles', apiContext.params.file_id);
	}
	catch (err) {
		console.log(err);
	}

	// ファイルが存在しているかどうか、指定ユーザーが所有するリソースであるかどうか
	if (file == null || file.creator.type != 'user' || !file.creator.id.equals(user._id)) {
		apiContext.response(404, 'file not found');
		return;
	}

	// not supported yet
	apiContext.response(501, 'deletion of storage files is not supported yet');
};
