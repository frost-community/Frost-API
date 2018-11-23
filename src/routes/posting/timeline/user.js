const ApiContext = require('../../../modules/ApiContext');
const MongoAdapter = require('../../../modules/MongoAdapter');
const $ = require('cafy').default;
const timeline = require('../../../modules/timeline');

/** @param {ApiContext} apiContext */
exports.list = async (apiContext) => {
	await apiContext.proceed({
		params: {
			userId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			limit: { cafy: $().number().int().range(0, 100), default: 30 },
			newer: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			older: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		scopes: ['post.read', 'user.read']
	});
	if (apiContext.responsed) return;

	// convert params value
	const limit = apiContext.params.limit;
	const newer = apiContext.params.newer != null ? MongoAdapter.buildId(apiContext.params.newer) : null;
	const older = apiContext.params.older != null ? MongoAdapter.buildId(apiContext.params.older) : null;

	try {
		// user
		const user = await apiContext.repository.findById('users', apiContext.params.userId);
		if (user == null) {
			apiContext.response(404, 'user as premise not found');
			return;
		}

		return await timeline(apiContext, 'status', [user._id], limit, { newer, older });
	}
	catch (err) {
		console.log(err);
	}
};
