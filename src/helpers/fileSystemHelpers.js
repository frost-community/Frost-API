const fs = require('fs');

const getFileNamesAsync = (dirPath) => new Promise((resolve, reject) => {
	fs.readdir(dirPath, (err, files) => {
		if (err) reject(err);
		resolve(files);
	});
});

const isFileAsync = (path) => new Promise((resolve, reject) => {
	fs.stat(path, (err, stats) => {
		if (err) reject(err);
		resolve(stats.isFile());
	});
});

module.exports = {
	getFileNamesAsync,
	isFileAsync
};
