'use strict';

module.exports = {};

class MissingArgumentsError extends Error {
	constructor() { super('missing arguments'); }
}
module.exports.MissingArgumentsError = MissingArgumentsError;

class InvalidArgumentError extends Error {
	constructor(paramName) { super(`argument '${paramName}' is invalid`); }
}
module.exports.InvalidArgumentError = InvalidArgumentError;

class DataBaseAccessError extends Error { }
module.exports.DataBaseAccessError = DataBaseAccessError;
