module.exports = (sourceObject) => {
	const array = Object.keys(sourceObject);
	array.sort();
	const sorted = {};

	for (const i of array) {
		sorted[i] = sourceObject[i];
	}

	return sorted;
};
