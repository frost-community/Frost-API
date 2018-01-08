const CollectionBase = require('../modules/collectionBase');

class ApplicationAccesses extends CollectionBase {
	constructor(db, config) {
		super('applicationAccesses', '../documentModels/applicationAccess', db, config);
	}
}
module.exports = ApplicationAccesses;
