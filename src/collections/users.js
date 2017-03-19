'use strict';

const CollectionBase = require('../helpers/collectionBase');

class Users extends CollectionBase {
	constructor(db, config) {
		super('users', '../documentModels/user', db, config);
	}
}
module.exports = Users;
