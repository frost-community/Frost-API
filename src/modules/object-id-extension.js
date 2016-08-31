'use strict';

module.exports = () => {
	ObjectId.prototype.getUnixtime = () => {
		const date = new Date(parseInt(this.toString().slice(0,8), 16)*1000);
		return Math.floor(date.getTime() / 1000);
	};
};
