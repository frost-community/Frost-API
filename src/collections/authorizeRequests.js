const CollectionBase = require('../modules/collectionBase');

class AuthorizeRequests extends CollectionBase {
	constructor(db, config) {
		super('authorizeRequests', '../documentModels/authorizeRequest', db, config);
	}
}
module.exports = AuthorizeRequests;
