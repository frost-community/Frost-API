const CollectionBase = require('../modules/collectionBase');

class UserFollowings extends CollectionBase {
	constructor(db, config) {
		super('userFollowings', '../documentModels/userFollowing', db, config);
	}
}
module.exports = UserFollowings;
