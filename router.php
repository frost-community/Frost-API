<?php

require_once __DIR__.'/util/api-exception.php';
require_once __DIR__.'/util/api-utils.php';
require_once __DIR__.'/util/call-api-controller.php';

require_once __DIR__.'/controllers/access-key.php';
require_once __DIR__.'/controllers/account.php';
require_once __DIR__.'/controllers/post.php';

$app->get('/', function ($req, $res, $args)
{
	$res->getBody()->write('Frost API Server');
	return $res;
});

$app->group('/accesskey', function()
{
	$this->post('/register', function ($req, $res, $args)
	{
		return AccessKey::register($req, $res, $this);
	});	
});

$app->group('/account', function()
{
	$this->post('/create', function ($req, $res, $args)
	{
		return callApiController($req, $res, $args, $this, function($req, $res, $args, $appName, $userId, $accessKey, $container)
		{
			return Account::create($req, $res, $appName, $userId, $container);
		});
	});	
});

$app->group('/post', function()
{
	$this->post('/create', function ($req, $res, $args)
	{
		return callApiController($req, $res, $args, $this, function($req, $res, $args, $appName, $userId, $accessKey, $container)
		{
			return Post::create($req, $res, $appName, $userId, $container);
		});
	});	
});
