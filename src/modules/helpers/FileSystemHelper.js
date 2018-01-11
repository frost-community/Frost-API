const fs = require('fs');
const { promisify } = require('util');

const isFileAsync = async (path) => {
	const stats = await promisify(fs.stat)(path);
	return stats.isFile();
};

const getFileNamesAsync = (dirPath) => {
	return promisify(fs.readdir)(dirPath);
};

const getFileDataAsync = (path, options) => {
	return promisify(fs.readFile)(path, options || {});
};

module.exports = {
	getFileNamesAsync,
	isFileAsync,
	getFileDataAsync
};
