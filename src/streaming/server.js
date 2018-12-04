const WebSocket = require('websocket');
const events = require('websocket-events');
const $ = require('cafy').default;
const MongoAdapter = require('../modules/MongoAdapter');
const { DirectoryRouter } = require('../modules/directoryRouter');
const TokensService = require('../services/TokensService');
const UserFollowingsService = require('../services/UserFollowingsService');
const StreamingContext = require('./modules/StreamingContext');
const RequestApi = require('./requestApi');
const EventStreamApi = require('./eventStreamApi');

/**
 * @param {DirectoryRouter} directoryRouter
 * @param {MongoAdapter} repository
*/
module.exports = (http, directoryRouter, repository, config) => {
	const server = new WebSocket.server({ httpServer: http });

	const tokensService = new TokensService(repository, config);
	const userFollowingsService = new UserFollowingsService(repository, config);

	const requestApi = RequestApi(directoryRouter, repository, config);
	const eventStreamApi = EventStreamApi(userFollowingsService);

	server.on('request', async request => {
		try {
			// verification
			const accessToken = request.resourceURL.query.access_token;
			if ($().string().pipe(tokensService.validateFormat).nok(accessToken)) {
				return request.reject(400, 'invalid param: access_token');
			}

			const token = await tokensService.findByAccessToken(accessToken);
			if (token == null) {
				return request.reject(400, 'invalid param: access_token');
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
			events(connection, { eventKeyName: '@frame' });

			connection.error = (eventName, reason, details = null) => {
				const res = { error: { reason } };
				if (details != null) {
					res.details = details;
				}
				connection.send(eventName, res);
			};

			connection.on('error', err => {
				if (err.message.indexOf('ECONNRESET') != -1) {
					return;
				}

				if (err.userEventError && connection.connected) {
					connection.error('default', 'invalid json format');
				}
				else {
					console.log('(streaming)connection error:', err);
				}
			});

			connection.on('close', () => {
				console.log(`(streaming)disconnected: userId=${connection.user._id}`);
			});

			requestApi.handle(connection);
			eventStreamApi.handle(connection);

			connection.on('default', (event) => {
				const ctx = new StreamingContext('default', connection, event);
				ctx.error('invalid event name');
			});

			console.log(`(streaming)connected: userId=${connection.user._id}`);
		}
		catch (err) {
			console.error(err);
		}
	});

	console.log('streaming server is ready.');
};
