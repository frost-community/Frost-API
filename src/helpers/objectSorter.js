'use strict';

module.exports = (srcObject) => {
	const array = Object.keys(srcObject);
	array.sort();
	const sorted = {};
	array.forEach(i => sorted[i] = srcObject[i]);

	return sorted;
};
