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
		// noop
	}

	if (file == null) {
		return new ApiResult(204);
	}

	let accessRightLevel = file.document.accessRight.level;

	if (accessRightLevel == 'private') {
		if (file.document.creatorId != request.user.document._id) {
			return new ApiResult(403, 'access denied');
		}
	}
	else if (accessRightLevel == 'specific') {
		// TODO: 公開してもいいかどうかを判断する
		return new ApiResult(500, 'not implemented yet');
	}
	else if (accessRightLevel != 'public') {
		return new ApiResult(500, 'unknown access-right level');
	}

	return new ApiResult(200, {storageFile: file.serialize()});
};

// 対象ファイルの削除
exports.delete = async (request) => {
	// TODO
	return new ApiResult(500, 'not implemented yet');
};
