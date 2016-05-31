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
	'config' => $config,
	'dbManager' => new \Utility\DatabaseManager($config['db']['hostname'], $config['db']['username'], $config['db']['password'], $config['db']['dbname'])
];

$app = new Slim\App($appConfig);

require_once './router.php';

$app->run();
