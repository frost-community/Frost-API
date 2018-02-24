const fs = require('fs');
const { promisify } = require('util');

class FileSystemHelper {
	static async isFile(path) {
		const stats = await promisify(fs.stat)(path);
		return stats.isFile();
	}

	static getFileNames(dirPath) {
		return promisify(fs.readdir)(dirPath);
	}

	static getFileData(path, options) {
		return promisify(fs.readFile)(path, options || {});
	}
}
module.exports = FileSystemHelper;
