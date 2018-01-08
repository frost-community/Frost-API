const fs = require('fs');

const isFileAsync = (path) => new Promise((resolve, reject) => {
	fs.stat(path, (err, stats) => {
		if (err) {
			reject(err);
		}
		resolve(stats.isFile());
	});
});

const getFileNamesAsync = (dirPath) => new Promise((resolve, reject) => {
	fs.readdir(dirPath, (err, files) => {
		if (err) {
			reject(err);
		}
		resolve(files);
	});
});

const getFileDataAsync = (path, options) => new Promise((resolve, reject) => {
	fs.readFile(path, options || {}, (err, data) => {
		if (err) {
			reject(err);
		}
		resolve(data);
	});
});

module.exports = {
	getFileNamesAsync,
	isFileAsync,
	getFileDataAsync
};
