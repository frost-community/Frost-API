const ApiContext = require('../../../../../modules/ApiContext');
// const $ = require('cafy').default;

/**
 * 対象ファイルの取得
 *
 * @param {ApiContext} apiContext
*/
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

	// file
	let file;
	try {
		file = await apiContext.db.storageFiles.findByIdAsync(apiContext.params.file_id);
	}
	catch (err) {
		console.log(err);
	}

	// 存在しない もしくは creatorの不一致がある
	if (file == null || file.creator.type != 'user' || !file.creator.id.equals(user._id)) {
		apiContext.response(204);
		return;
	}

	// level
	let level = file.accessRight.level;

	const requestUserId = apiContext.user._id;
	const isOwnerAccess = file.creator.id.equals(requestUserId);

	if (level == 'private') {
		// 所有者以外のユーザー
		if (!isOwnerAccess) {
			return apiContext.response(403, 'this operation is not permitted');
		}
	}
	else if (level == 'specific') {
		const users = file.accessRight.users;

		// アクセスを許可していないユーザー
		if (!isOwnerAccess && (users == null || !users.some(i => i == requestUserId))) {
			return apiContext.response(403, 'this operation is not permitted');
		}
	}
	else if (level != 'public') {
		return apiContext.response(500, 'unknown access-right level');
	}

	apiContext.response(200, { storageFile: file.serialize(true) });
};

/**
 * 対象ファイルの削除
 *
 * @param {ApiContext} apiContext
*/
exports.delete = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['storageWrite']
	});
	if (apiContext.responsed) return;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const isOwnerAccess = user._id.equals(apiContext.user._id);
	if (!isOwnerAccess) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// file
	let file;
	try {
		file = await apiContext.db.storageFiles.findByIdAsync(apiContext.params.file_id);
	}
	catch (err) {
		console.log(err);
	}

	if (file == null) {
		return apiContext.response(404);
	}

	// 所有していないリソース
	if (file.creator.type != 'user' || !file.creator.id.equals(user._id)) {
		return apiContext.response(403);
	}

	// TODO
	return apiContext.response(501, 'not implemented yet');
};
