'use strict';

class ApiResult {
	constructor(statusCode, data, needStatusCode) {
		this.statusCode = statusCode;
		this.data = data;
		this.needStatusCode = needStatusCode != null ? needStatusCode : true;
	}
}
module.exports = ApiResult;
