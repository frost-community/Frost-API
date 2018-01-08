const CollectionBase = require('../modules/collectionBase');

class Applications extends CollectionBase {
	constructor(db, config) {
		super('applications', '../documentModels/application', db, config);
	}

	createAsync(name, creator, description, permissions) {
		return super.createAsync({
			name: name,
			creatorId: creator.document._id,
			description: description,
			permissions: permissions
		});
	}
}
module.exports = Applications;
