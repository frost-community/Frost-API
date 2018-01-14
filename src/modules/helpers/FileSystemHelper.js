const fs = require('fs');
const { promisify } = require('util');

const isFile = async (path) => {
	const stats = await promisify(fs.stat)(path);
	return stats.isFile();
};

const getFileNames = (dirPath) => {
	return promisify(fs.readdir)(dirPath);
};

const getFileData = (path, options) => {
	return promisify(fs.readFile)(path, options || {});
};

module.exports = {
	getFileNames,
	isFile,
	getFileData
};
