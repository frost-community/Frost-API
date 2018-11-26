const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const $ = require('cafy').default;
const RedisEventEmitter = require('../../modules/RedisEventEmitter');
const DataTypeIdHelper = require('../../modules/helpers/DataTypeIdHelper');

/** @param {ApiContext} apiContext */
exports.create = async (apiContext) => {
	await apiContext.proceed({
		params: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() },
			description: { cafy: $().string().range(0, 256), default: '' },
			name: { cafy: $().string().range(1, 32), default: 'froster' }
		}, scopes: ['user.create']
	});
	if (apiContext.responsed) return;

	const {
		screenName,
		password,
		name,
		description
	} = apiContext.params;

	// screenName
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

	// password
	if (!apiContext.usersService.checkFormatPassword(password)) {
		apiContext.response(400, 'password is invalid format');
		return;
	}

	const user = await apiContext.usersService.create(screenName, password, name, description);
	if (user == null) {
		apiContext.response(500, 'failed to create account');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
};

/** @param {ApiContext} apiContext */
exports.list = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	const users = await apiContext.repository.findArray('users', {});
	if (users.length == 0) {
		apiContext.response(204);
		return;
	}

	const promises = users.map(user => apiContext.usersService.serialize(user));
	const serializedUsers = await Promise.all(promises);

	apiContext.response(200, { users: serializedUsers });
};

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		params: {
			userId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	const user = await apiContext.repository.findById('users', apiContext.params.userId);
	if (user == null) {
		apiContext.response(404, 'user not found');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
};

// TODO: get に統合する
/** @param {ApiContext} apiContext */
exports.get2 = async (apiContext) => {
	await apiContext.proceed({
		params: {
			'screen_names': { cafy: $().string(), default: '' }
		},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	if (apiContext.params.screen_names == '') {
		apiContext.response(400, 'screen_names is enpty');
		return;
	}

	const screenNames = apiContext.params.screen_names.split(',');

	if (screenNames.lenth > 100) {
		apiContext.response(400, 'screen_names is limit over(100 items or less)');
		return;
	}

	if (screenNames.some(screenName => !apiContext.usersService.validFormatScreenName(screenName))) {
		apiContext.response(400, 'screen_names is invalid');
		return;
	}

	// TODO: screenNamesの重複チェック

	const users = await apiContext.usersService.findArrayByScreenNames(screenNames);

	if (users.length == 0) {
		apiContext.response(204);
		return;
	}

	const promises = users.map(user => apiContext.usersService.serialize(user));
	const serializedUsers = await Promise.all(promises);

	apiContext.response(200, { users: serializedUsers });
};

/** @param {ApiContext} apiContext */
exports.update = async (apiContext) => {
	await apiContext.proceed({
		params: {
			userId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			screenName: { cafy: $().string(), default: null },
			description: { cafy: $().string().range(0, 256), default: null },
			name: { cafy: $().string().range(1, 32), default: null },
			iconFileId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	const { userId, screenName, name, description, iconFileId } = apiContext.params;
	const data = { };

	// アイコンを設定するときは、storage.readスコープを要求する
	if (iconFileId != null && !apiContext.applicationsService.hasScope(apiContext.application, 'storage.read')) {
		apiContext.response(403, { message: 'you do not have any scopes', details: ['storage.read'] });
		return;
	}

	const user = await apiContext.repository.findById('users', userId);
	if (user == null) {
		apiContext.response(404, 'user not found');
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

	// iconFileId
	if (iconFileId != null) {
		const iconFile = await apiContext.repository.findById('storageFiles', iconFileId);
		if (iconFile == null) {
			apiContext.response(404, 'icon file not found');
			return;
		}

		if (!iconFile.creator.id.equals(apiContext.user._id)) {
			apiContext.response(400, 'icon file must be owned');
			return;
		}

		if (iconFile.accessRight.level != 'public') {
			apiContext.response(400, 'icon file must be public');
			return;
		}

		data.iconFileId = iconFileId;
	}

	if (Object.keys(data).length == 0) {
		apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
		return;
	}

	const updated = await apiContext.repository.updateById('users', userId, data);
	if (updated == null) {
		apiContext.response(500, 'failed to update user');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(updated) });
};

/** @param {ApiContext} apiContext */
exports.follow = async (apiContext) => {
	await apiContext.proceed({
		params: {
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			message: { cafy: $().string().pipe(i => !/^\s*$/.test(i) || /^[\s\S]{1,64}$/.test(i)), default: null }
		},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	const { targetUserId, message } = apiContext.params;

	// fetch: target user
	const targetUser = await apiContext.repository.findById('users', targetUserId);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	// expect: me != targetUser
	if (targetUser._id.equals(apiContext.user._id)) {
		apiContext.response(400, 'target user is you');
		return;
	}

	// ドキュメント作成・更新
	let userFollowing;
	try {
		userFollowing = await apiContext.userFollowingsService.create(apiContext.user._id, targetUser._id, message);
	}
	catch (err) {
		console.log('failed follow');
		console.log(err);
	}

	if (userFollowing == null) {
		apiContext.response(500, 'failed follow');
		return;
	}

	// RedisEvent following を発行
	const eventSender = new RedisEventEmitter('frost-api', false);
	await eventSender.emit(DataTypeIdHelper.build(['redis', 'following']), {
		following: true,
		sourceId: apiContext.user._id.toString(),
		targetId: targetUserId
	});
	await eventSender.dispose();

	apiContext.response(200, 'following');
};

/** @param {ApiContext} apiContext */
exports.unfollow = async (apiContext) => {
	await apiContext.proceed({
		params: {
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	const { targetUserId, message } = apiContext.params;

	// fetch: target user
	const targetUser = await apiContext.repository.findById('users', targetUserId);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	// expect: me != targetUser
	if (targetUser._id.equals(apiContext.user._id)) {
		apiContext.response(400, 'target user is you');
		return;
	}

	try {
		await apiContext.userFollowingsService.removeBySrcDestId(apiContext.user._id, targetUser._id);
	}
	catch (err) {
		console.log('failed unfollow');
		console.log(err);
	}

	// RedisEvent following を発行
	const eventSender = new RedisEventEmitter('frost-api', false);
	await eventSender.emit(DataTypeIdHelper.build(['redis', 'following']), {
		following: false,
		sourceId: apiContext.user._id.toString(),
		targetId: targetUserId
	});
	await eventSender.dispose();

	apiContext.response(200, { following: false });
};
