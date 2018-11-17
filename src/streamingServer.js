const WebSocket = require('websocket');
const events = require('websocket-events');
const MongoAdapter = require('./modules/MongoAdapter');
const { DirectoryRouter } = require('./modules/directoryRouter');
const TokensService = require('./services/TokensService');
const UserFollowingsService = require('./services/UserFollowingsService');
const RequestApi = require('./streamingApis/request');
const EventApi = require('./streamingApis/event');

/**
 * @param {DirectoryRouter} directoryRouter
 * @param {MongoAdapter} repository
*/
module.exports = (http, directoryRouter, repository, config) => {
	const server = new WebSocket.server({ httpServer: http });

	const tokensService = new TokensService(repository, config);
	const userFollowingsService = new UserFollowingsService(repository, config);

	server.on('request', async request => {
		const query = request.resourceURL.query;

		// verification
		const accessToken = query.access_token;
		if (accessToken == null) {
			return request.reject(400, 'access_token parameter is empty');
		}

		const token = await tokensService.findByAccessToken(accessToken);
		if (token == null) {
			return request.reject(400, 'access_token parameter is invalid');
		}

		const [user, application] = await Promise.all([
			repository.findById('users', token.userId),
			repository.findById('applications', token.applicationId)
		]);
		if (user == null) {
			return request.reject(500, 'user not found');
		}
		if (application == null) {
			return request.reject(500, 'application not found');
		}

		const connection = request.accept();
		connection.user = user;
		connection.authInfo = { scopes: token.scopes, application: application };

		// support user events
		events(connection);

		connection.error = (eventName, message, details = null) => {
			if (connection.connected) {
				const res = { success: false, message };
				if (details != null) {
					res.details = details;
				}
				connection.send(eventName, res);
			}
		};

		connection.on('error', err => {
			if (err.message.indexOf('ECONNRESET') != -1) {
				return;
			}

			if (err.userEventError) {
				connection.error('default', 'request format is invalid');
			}
			else {
				console.log('streaming error:', err);
			}
		});

		connection.on('close', () => {
			console.log(`disconnected streaming. user: ${connection.user._id}`);
		});

		RequestApi(connection, directoryRouter, repository, config);
		EventApi(connection, userFollowingsService);

		connection.on('default', (reqData) => {
			connection.error('default', 'invalid event name');
		});

		console.log(`connected streaming. user: ${connection.user._id}`);
	});

	console.log('streaming server is ready.');
};
