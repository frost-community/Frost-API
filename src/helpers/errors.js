class MissingArgumentsError extends Error {
	constructor() { super('missing arguments'); }
}

class InvalidArgumentError extends Error {
	constructor(paramName) { super(`argument '${paramName}' is invalid`); }
}

class DataBaseAccessError extends Error { }

module.exports = {
	MissingArgumentsError,
	InvalidArgumentError,
	DataBaseAccessError
};
