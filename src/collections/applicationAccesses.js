'use strict';

const CollectionBase = require('../helpers/collectionBase');

class ApplicationAccesses extends CollectionBase {
	constructor(db, config) {
		super('applicationAccesses', '../documentModels/applicationAccess', db, config);
	}
}
module.exports = ApplicationAccesses;
