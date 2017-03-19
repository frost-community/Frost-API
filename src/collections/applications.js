'use strict';

const CollectionBase = require('../helpers/collectionBase');

class Applications extends CollectionBase {
	constructor(db, config) {
		super('applications', '../documentModels/application', db, config);
	}
}
module.exports = Applications;
