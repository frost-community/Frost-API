const User = require('../../../../../documentModels/user');
// const $ = require('cafy').default;

// 対象ファイルの取得
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['storageRead']
	});
	if (apiContext.responsed) return;

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
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
	if (file == null || file.document.creator.type != 'user' || !file.document.creator.id.equals(user.document._id)) {
		apiContext.response(204);
		return;
	}

	// level
	let level = file.document.accessRight.level;

	const requestUserId = apiContext.user.document._id;
	const isOwnerAccess = file.document.creator.id.equals(requestUserId);

	if (level == 'private') {
		// 所有者以外のユーザー
		if (!isOwnerAccess) {
			return apiContext.response(403, 'this operation is not permitted');
		}
	}
	else if (level == 'specific') {
		const users = file.document.accessRight.users;

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

// 対象ファイルの削除
exports.delete = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['storageWrite']
	});
	if (apiContext.responsed) return;

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const isOwnerAccess = user.document._id.equals(apiContext.user.document._id);
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
	if (file.document.creator.type != 'user' || !file.document.creator.id.equals(user.document._id)) {
		return apiContext.response(403);
	}

	// TODO
	return apiContext.response(501, 'not implemented yet');
};
