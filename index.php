<?php

require_once __DIR__.'/vendor/autoload.php';
require_once __DIR__.'/config.php';
require_once __DIR__.'/util/utils-loader.php';
require_once __DIR__.'/models/models-loader.php';
require_once __DIR__.'/controllers/controllers-loader.php';

$appConfig = [
	'settings' => [
		'displayErrorDetails' => true
	],
	'config' 	=> $config,
];

ORM::configure("mysql:dbname={$config['db']['dbname']};host={$config['db']['hostname']};charset=utf8");
ORM::configure('username', $config['db']['username']);
ORM::configure('password', $config['db']['password']);

$app = new Slim\App($appConfig);

require_once './router.php';

$app->run();
