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

/** 現在の状態に対しては無効な操作が行われたときに発生します */
class InvalidOperationError extends Error {
	constructor(message) {
		super(message);
	}
}

class DataBaseAccessError extends Error { }

module.exports = {
	MissingArgumentsError,
	InvalidArgumentError,
	InvalidOperationError,
	DataBaseAccessError
};
