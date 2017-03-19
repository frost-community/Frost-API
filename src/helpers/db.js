'use strict';

const Applications = require('../collections/applications');
const ApplicationAccesses = require('../collections/applicationAccesses');
const AuthorizeRequests = require('../collections/authorizeRequests');
const Posts = require('../collections/posts');
const Users = require('../collections/users');
const UserFollowings = require('../collections/userFollowings');

class Db {
	constructor(config, dbProvider) {
		if (config == null || dbProvider == null)
			throw new Error('missing arguments');

		this._config = config;
		this.dbProvider = dbProvider;
	}

	get applications() {
		return new Applications(this, this._config);
	}

	get applicationAccesses() {
		return new ApplicationAccesses(this, this._config);
	}

	get authorizeRequests() {
		return new AuthorizeRequests(this, this._config);
	}

	get posts() {
		return new Posts(this, this._config);
	}

	get users() {
		return new Users(this, this._config);
	}

	get userFollowings() {
		return new UserFollowings(this, this._config);
	}
}
module.exports = Db;
