'use strict';

module.exports = (objectA, objectB) => {
	if (!objectB)
		objectB = {};

	for (var property in objectB) {
		if (objectB.hasOwnProperty(property))
			objectA[property] = objectB[property];
	}
};
