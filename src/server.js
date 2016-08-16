'use strict';

const bodyParser = require('body-parser');
const koa = require('koa');
const router = require('./modules/router');

exports.start = () => {
	console.log("--------------------");
	console.log("  Frost API Server  ");
	console.log("--------------------");

	const app = koa();

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
	var port = 8000;
	app.listen(port);
	console.log(`listen on port: ${port}`);
}
