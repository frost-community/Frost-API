'use strict';

const ObjectId = require('mongodb').ObjectId;

module.exports = () => {
	ObjectId.prototype.getUnixtime = () => {
		return parseInt(this.toString().slice(0, 8), 16);
	};
};
