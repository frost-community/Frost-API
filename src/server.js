const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const sanitize = require('mongo-sanitize');
const AsyncLock = require('async-lock');
const passport = require('passport');
const { loadConfig } = require('./modules/helpers/GeneralHelper');
const MongoAdapter = require('./modules/MongoAdapter');
const { DirectoryRouter, Route } = require('./modules/directoryRouter');
const ApiContext = require('./modules/ApiContext');
const routeList = require('./routeList');
const defineStrategies = require('./modules/defineStrategies');

module.exports = async () => {
	try {
		console.log('+------------------+');
		console.log('| Frost API Server |');
		console.log('+------------------+');

		let config = loadConfig();
		if (config == null) {
			console.log('config file not found. please create in setup mode. (command: npm run setup)');
			return;
		}

		const streams = new Map(); // memo: keyはChannelName
		const lock = new AsyncLock();

		const dbConfig = config.api.database;
		const repository = await MongoAdapter.connect(
			dbConfig.host,
			dbConfig.database,
			dbConfig.password != null ? `${dbConfig.username}:${dbConfig.password}` : dbConfig.username);

		defineStrategies(repository);

		const app = express();
		app.disable('x-powered-by');
		app.set('etag', 'weak');
		app.use(require('./modules/middlewares/apiSend')); // memo: apiSendはAPIレスポンスを返すときに必要なので早い段階で呼び出すほうが良い
		app.use(compression({ threshold: 0, level: 9, memLevel: 9 }));
		app.use(passport.initialize());
		app.use(bodyParser.json({ limit: '1mb' }));
		app.use((err, req, res, next) => {
			if (err instanceof SyntaxError && err.message.indexOf('JSON')) {
				req.apiContext.response(400, 'invalid json format');
				res.apiSend(req.apiContext);
				return;
			}
			next();
		});

		app.use((req, res, next) => {
			// sanitize
			req.body = sanitize(req.body);
			req.params = sanitize(req.params);

			// apiContext
			req.apiContext = new ApiContext(repository, config, { streams, lock, params: req.params, query: req.query, body: req.body });

			// cors headers
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

			next();
		});

		// add all routes
		app.use(passport.authenticate('accessToken', { session: false, failWithError: true }));
		const directoryRouter = new DirectoryRouter(app);
		for (const route of routeList) {
			directoryRouter.addRoute(new Route(route[0], route[1]));
		}

		// not found
		app.use((req, res) => {
			const apiContext = req.apiContext;
			apiContext.response(404, 'endpoint not found, or method is not supported');
			res.apiSend(apiContext);
		});

		// error handling
		app.use((err, req, res, next) => {
			const apiContext = req.apiContext;
			if (err.status != null) {
				apiContext.response(err.status, err.message);
			}
			else {
				console.log(err);
				apiContext.response(500, 'internal error');
			}
			res.apiSend(apiContext);
		});

		const http = app.listen(config.api.port, () => {
			console.log(`listen on port: ${config.api.port}`);
		});

		require('./streaming-server')(http, directoryRouter, streams, repository, config);
	}
	catch (err) {
		console.log('Unprocessed Server Error:', err);
	}
};
