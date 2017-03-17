'use strict';

/**
 * Creates an object from array.
 * @param  {[]} source
 * @return {Object}
 */
const arrayToObject = (source) => {
	return source.reduce((result, item) => {
		result[item] = item;
		return result;
	}, {});
};

module.exports = arrayToObject;
