<?php

require_once __DIR__.'/vendor/autoload.php';
require_once __DIR__.'/util/utils-loader.php';
require_once __DIR__.'/models/models-loader.php';
require_once __DIR__.'/controllers/controllers-loader.php';

require_once __DIR__.'/frost-api-server.php';
require_once __DIR__.'/router.php';
require_once __DIR__.'/route.php';

require_once __DIR__.'/config.php';
require_once __DIR__.'/routes.php';

ORM::configure("mysql:dbname={$config['db']['dbname']};host={$config['db']['hostname']};charset=utf8");
ORM::configure('username', $config['db']['username']);
ORM::configure('password', $config['db']['password']);

$container = [
	'config' => $config,
	'database' => new DatabaseManager()
];

$appConfig = [ 'settings' => [ 'displayErrorDetails' => true ] ];

$app = new \Slim\App($appConfig);
$router = new \Router($app, $container);
$server = new \FrostAPIServer($app, $router);

foreach($routes as $route)
	$server->addRoute(new Route($route[0], $route[1], $route[2], $route[3]));

$server->executeServer();
