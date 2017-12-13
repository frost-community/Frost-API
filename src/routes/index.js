exports.get = async (apiContext) => {
	await apiContext.check({
		permissions: []
	});

	apiContext.response(200, 'Frost API Server');
};
