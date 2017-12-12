class MissingArgumentsError extends Error {
	constructor() {
		super('missing arguments');
	}
}

class InvalidArgumentError extends Error {
	constructor(paramName) {
		super(`argument '${paramName}' is invalid`);
	}
}

class DataBaseAccessError extends Error { }

class ApiError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

module.exports = {
	MissingArgumentsError,
	InvalidArgumentError,
	DataBaseAccessError,
	ApiError
};
