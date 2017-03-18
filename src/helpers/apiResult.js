'use strict';

class ApiResult {
	constructor(statusCode, data) {
		this.statusCode = statusCode;
		this.data = data;
	}
}
module.exports = ApiResult;
