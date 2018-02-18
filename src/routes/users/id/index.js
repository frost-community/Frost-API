const ApiContext = require('../../../modules/ApiContext');
const MongoAdapter = require('../../../modules/MongoAdapter');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user not found');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
};

/** @param {ApiContext} apiContext */
exports.patch = async (apiContext) => {
	await apiContext.proceed({
		body: {
			screenName: { cafy: $().string(), default: null },
			description: { cafy: $().string().range(0, 256), default: null },
			name: { cafy: $().string().range(1, 32), default: null },
			icon: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		permissions: ['userWrite']
	});
	if (apiContext.responsed) return;

	const { screenName, name, description, icon } = apiContext.body;
	const data = { };

	// アイコンを設定するときは、storageRead権限を要求する
	if (icon != null && !apiContext.applicationsService.hasPermission(apiContext.application, 'storageRead')) {
		apiContext.response(403, { message: 'you do not have any permissions', details: ['storageRead'] });
		return;
	}

	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	if (!apiContext.user._id.equals(user._id)) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// screenName
	if (screenName != null) {
		if (!apiContext.usersService.validFormatScreenName(screenName)) {
			apiContext.response(400, 'screenName is invalid format');
			return;
		}
		if (!apiContext.usersService.availableScreenName(screenName)) {
			apiContext.response(400, 'screenName is invalid');
			return;
		}
		if (!await apiContext.usersService.nonDuplicatedScreenName(screenName)) {
			apiContext.response(400, 'this screenName is already exists');
			return;
		}
		data.screenName = screenName;
	}

	// name
	if (name != null) {
		data.name = name;
	}

	// description
	if (description != null) {
		data.description = description;
	}

	// icon
	if (icon != null) {
		const file = await apiContext.repository.findById('storageFiles', icon);
		if (!file.creator.id.equals(apiContext.user._id)) {
			apiContext.response(400, 'icon file must be owned');
			return;
		}

		if (file.accessRight.level != 'public') {
			apiContext.response(400, 'icon file must be public');
			return;
		}

		data.icon = icon;
	}

	if (Object.keys(data).length == 0) {
		apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
		return;
	}

	const updated = await apiContext.repository.updateById('users', apiContext.params.id, data);
	if (updated == null) {
		apiContext.response(500, 'failed to update user');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(updated) });
};
