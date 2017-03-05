'use strict';

module.exports = (objectA, objectB) => {
	if (!objectB)
		objectB = {};

	for (const property in objectB) {
		if (objectB.hasOwnProperty(property))
			objectA[property] = objectB[property];
	}
};
