const fs = require('fs');
const { promisify } = require('util');

class FileSystemHelper {
	async isFile(path) {
		const stats = await promisify(fs.stat)(path);
		return stats.isFile();
	}

	getFileNames(dirPath) {
		return promisify(fs.readdir)(dirPath);
	}

	getFileData(path, options) {
		return promisify(fs.readFile)(path, options || {});
	}
}
module.exports = FileSystemHelper;
