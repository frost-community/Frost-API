// const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {},
		permissions: ['postWrite']
	});

	throw new ApiError(501, 'not implemented yet');
};
