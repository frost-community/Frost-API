const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const sanitize = require('mongo-sanitize');
const passport = require('passport');
const { DirectoryRouter, Route } = require('../modules/directoryRouter');
const ApiContext = require('../modules/ApiContext');
const routeList = require('../routeList');
const defineStrategies = require('./modules/defineStrategies');
const apiSendMiddleware = require('./middlewares/apiSend');

module.exports = async (lock, repository, config) => {
	defineStrategies(repository);

	const app = express();
	app.disable('x-powered-by');
	app.set('etag', 'weak');
	app.use(apiSendMiddleware); // memo: apiSendはAPIレスポンスを返すときに必要なので早い段階でuseするほうが良い
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

		// apiContext
		req.apiContext = new ApiContext(repository, config, { lock, params: req.body });

		// cors headers
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

		next();
	});

	// add all routes
	app.use(passport.authenticate('accessToken', { session: false, failWithError: true }));
	const directoryRouter = new DirectoryRouter(app);
	for (const route of routeList) {
		directoryRouter.addRoute(new Route(route));
	}

	// not found
	app.use((req, res) => {
		const apiContext = req.apiContext;
		apiContext.response(404, 'endpoint not found');
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

	const http = app.listen(config.port, () => {
		console.log(`listen on port: ${config.port}`);
	});

	return { http, directoryRouter };
};
