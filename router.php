<?php

require_once __DIR__.'/controllers/access-key.php';
require_once __DIR__.'/controllers/account.php';
require_once __DIR__.'/controllers/application.php';
require_once __DIR__.'/controllers/post.php';
require_once __DIR__.'/controllers/web.php';

$app->get('/', function ($req, $res, $args)
{
	$res->getBody()->write('Frost API Server');
	return $res;
});

$app->group('/internal', function()
{
	$this->group('/application', function()
	{
		$this->post('/create', function ($req, $res, $args)
		{

		});

		$this->post('/regenerate-key', function ($req, $res, $args)
		{

		});
		
		$this->get('/application-key', function ($req, $res, $args)
		{

		});
	});

	$this->get('/request-key', function ($req, $res, $args)
	{

	});

	$this->group('/ice-auth', function()
	{
		$this->get('/access-key', function ($req, $res, $args)
		{
			return AccessKey::register($req, $res, $this);
		});
	});

	$this->group('/account', function()
	{
		$this->post('/create', function ($req, $res, $args)
		{
			return callApiController($req, $res, $args, $this, function($req, $res, $args, $appName, $userId, $accessKey, $container)
			{
				return Account::create($req, $res, $appName, $userId, $container);
			});
		});
	});
});

$app->group('/ice-auth', function()
{
	$this->get('/authorize', function ($req, $res, $args)
	{

	});

	$this->post('/authorize', function ($req, $res, $args)
	{

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
