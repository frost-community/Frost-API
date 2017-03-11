'use strict';

const ioInterface = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

exports.questionAsync = (query) => new Promise((resolve, reject) => {
	ioInterface.question(query, (ans) => {
		resolve(ans);
	});
});
