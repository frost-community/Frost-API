'use strict';

const bodyParser = require('body-parser');
const koa = require('koa');
const co = require('co');
const router = require('./modules/router');
const loadConfig = require('./modules/load-config');

exports.start = () => {
	console.log("--------------------");
	console.log("  Frost API Server  ");
	console.log("--------------------");

	const app = koa();
	var config = loadConfig();

	var testAction = function *(req, res) {
		console.log(`test`);
	}

	const routes = [
		['get', '/', [], testAction],
		['post', '/application', [], testAction],
		['get', '/application/:id', [], testAction],
		['post', '/application/:id/application-key', [], testAction],
		['get', '/application/:id/application-key', [], testAction],
		['get', '/user/:id', [], testAction],
	]

	router(app, routes, function *(req, res) {console.log("before");});

	app.listen(config.api.port);
	console.log(`listen on port: ${config.api.port}`);
}
