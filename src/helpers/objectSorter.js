'use strict';

module.exports = (srcObject) => {
	const array = Object.keys(srcObject);
	array.sort();
	const sorted = {};

	for (const i of array) {
		sorted[i] = srcObject[i];
	}

	return sorted;
};
