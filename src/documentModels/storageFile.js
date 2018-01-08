const objectSorter = require('../modules/objectSorter');
const moment = require('moment');
const { MissingArgumentsError } = require('../modules/errors');

class StorageFile {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		this.document = document;
		this.db = db;
	}

	// TODO: 各種操作用メソッドの追加

	serialize(includeFileData) {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// creator.id
		res.creator.id = res.creator.id.toString();

		// size
		res.size = res.fileData.length();

		// fileData
		res.fileData = res.fileData.toString('base64');

		// exclude fileData
		if (!includeFileData) {
			delete res.fileData;
		}

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.storageFiles.findByIdAsync(this.document._id)).document;
	}
}
module.exports = StorageFile;
