'use strict';

const ApiResult = require('../../../../../helpers/apiResult');

// 対象ファイルの取得
exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['storageRead']
	});

	if (result != null) {
		return result;
	}

	let file;
	try {
		file = await request.db.storageFiles.findByIdAsync(request.params.file_id);
	}
	catch(err) {
		console.log(err);
	}

	// 存在しない もしくは creatorの不一致がある
	if (file == null || file.document.creator.type != 'user' || file.document.creator.id.toString() != request.params.id) {
		return new ApiResult(204);
	}

	let level = file.document.accessRight.level;
	const requestUserId = request.user.document._id;

	if (level == 'private') {
		if (file.document.creator.id != requestUserId) {
			return new ApiResult(403, 'access denied');
		}
	}
	else if (level == 'specific') {
		const users = file.document.accessRight.users;

		// アクセスを許可したユーザーでない
		if (users != null && !users.some(i => i == requestUserId)) {
			return new ApiResult(403, 'access denied');
		}
	}
	else if (level != 'public') {
		return new ApiResult(500, 'unknown access-right level');
	}

	return new ApiResult(200, {storageFile: file.serialize(true)});
};

// 対象ファイルの削除
exports.delete = async (request) => {
	// TODO
	return new ApiResult(501, 'not implemented yet');
};
