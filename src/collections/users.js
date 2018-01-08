const CollectionBase = require('../modules/collectionBase');
const crypto = require('crypto');
const randomRange = require('../modules/randomRange');

class Users extends CollectionBase {
	constructor(db, config) {
		super('users', '../documentModels/user', db, config);
	}

	createAsync(screenName, password, name, description) {
		const salt = randomRange(1, 99999);
		const sha256 = crypto.createHash('sha256');
		sha256.update(`${password}.${salt}`);
		const hash = `${sha256.digest('hex')}.${salt}`;

		return super.createAsync({
			screenName: screenName,
			passwordHash: hash,
			name: name,
			description: description
		});
	}
}
module.exports = Users;
