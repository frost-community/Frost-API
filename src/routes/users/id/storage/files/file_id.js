'use strict';

const ApiResult = require('../../../../../helpers/apiResult');
const User = require('../../../../../documentModels/user');

// 対象ファイルの取得
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

	// file
	let file;
	try {
		file = await request.db.storageFiles.findByIdAsync(request.params.file_id);
	}
	catch(err) {
		console.log(err);
	}

	// 存在しない もしくは creatorの不一致がある
	if (file == null || file.document.creator.type != 'user' || !file.document.creator.id.equals(user.document._id)) {
		return new ApiResult(204);
	}

	// level
	let level = file.document.accessRight.level;

	const requestUserId = request.user.document._id;
	const isOwnerAccess = file.document.creator.id.equals(requestUserId);

	if (level == 'private') {
		// 所有者以外のユーザー
		if (!isOwnerAccess) {
			return new ApiResult(403, 'this operation is not permitted');
		}
	}
	else if (level == 'specific') {
		const users = file.document.accessRight.users;

		// アクセスを許可していないユーザー
		if (!isOwnerAccess && (users == null || !users.some(i => i == requestUserId))) {
			return new ApiResult(403, 'this operation is not permitted');
		}
	}
	else if (level != 'public') {
		return new ApiResult(500, 'unknown access-right level');
	}

	return new ApiResult(200, {storageFile: file.serialize(true)});
};

// 対象ファイルの削除
exports.delete = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['storageWrite']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user as premise not found');
	}

	const isOwnerAccess = user.document._id.equals(request.user.document._id);
	if (!isOwnerAccess) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	// file
	let file;
	try {
		file = await request.db.storageFiles.findByIdAsync(request.params.file_id);
	}
	catch(err) {
		console.log(err);
	}

	if (file == null) {
		return new ApiResult(404);
	}

	// 所有していないリソース
	if (file.document.creator.type != 'user' || !file.document.creator.id.equals(user.document._id)) {
		return new ApiResult(403);
	}

	// TODO
	return new ApiResult(501, 'not implemented yet');
};
