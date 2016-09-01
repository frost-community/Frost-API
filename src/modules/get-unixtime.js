'use strict';

module.exports = (objectId) => {
	return parseInt(objectId.toString().slice(0, 8), 16);
};
