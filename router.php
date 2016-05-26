<?php

require_once __DIR__.'/controllers/access-key.php';
require_once __DIR__.'/controllers/ice-auth.php';
require_once __DIR__.'/controllers/post.php';
require_once __DIR__.'/controllers/request-key.php';
require_once __DIR__.'/controllers/user.php';

function indexPage ($req, $res, $container)
{
	$res->getBody()->write('Frost API Server');
	return $res;
}

$routes = [
	['method'=>'get',  'endpoint'=>'/',                                     'permissions'=>[], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/request-key',                 'permissions'=>[], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/authorize',                   'permissions'=>[], 'indexPage'],
	['method'=>'post', 'endpoint'=>'/ice-auth/authorize',                   'permissions'=>[], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/access-key',                  'permissions'=>[], 'indexPage'],
	['method'=>'post', 'endpoint'=>'/internal/account/create',              'permissions'=>['internal'], 'indexPage'],
	['method'=>'post', 'endpoint'=>'/internal/application/create',          'permissions'=>['internal'], 'Application::create'],
	['method'=>'post', 'endpoint'=>'/internal/application/regenerate-key',  'permissions'=>['internal'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/internal/application/application-key', 'permissions'=>['internal'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/user',                                 'permissions'=>['user-read'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/post/timeline',                        'permissions'=>['post-read'], 'Post::timeline'],
	['method'=>'post', 'endpoint'=>'/post/create',                          'permissions'=>['post-write'], 'Post::create']
];

foreach ($routes as $route)
{
	$method = $route['method'];
	$endPoint = $route['endpoint'];

	$app->$method($endPoint, function ($req, $res, $args) use($routes, $route, $endPoint)
	{
		// TODO: validate access-key

		// TODO: validate permissions

		if(!is_callable(current(array_slice($route, -1, 1))))
			throw new Exception("last item of route was non-callable (endpoint: $endPoint)");
		$callable = current(array_slice($route, -1, 1));

		$controllerArgs = [$req, $res, $this];

		if ($isInternal)
		{
			if (!RequestKey::validate($req->getParams()['request-key'], $container->config, $container->dbManager))
				return withFailure($res, 'request-key is invalid. this endpoint is web only');
		}

		if ($isLogin)
		{
			$controllerArgs += $user;
		}

		return call_user_func_array($callable, $controllerArgs);
	});
}
