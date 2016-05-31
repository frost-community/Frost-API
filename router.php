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
	['method'=>'get',  'endpoint'=>'/',                            'permissions'=>[], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/request-key',        'permissions'=>[], 'ice-auth::requestKey'],
	['method'=>'get',  'endpoint'=>'/ice-auth/authorize',          'permissions'=>[], 'ice-auth::authorizePage'],
	['method'=>'post', 'endpoint'=>'/ice-auth/authorize',          'permissions'=>[], 'ice-auth::authorize'],
	['method'=>'get',  'endpoint'=>'/ice-auth/access-key',         'permissions'=>['internal'], 'ice-auth::accessKey'],
	['method'=>'post', 'endpoint'=>'/account/create',              'permissions'=>['internal'], 'indexPage'],
	['method'=>'post', 'endpoint'=>'/application/create',          'permissions'=>['internal'], 'Application::create'],
	['method'=>'post', 'endpoint'=>'/application/regenerate-key',  'permissions'=>['internal'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/application/application-key', 'permissions'=>['internal'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/user',                        'permissions'=>['user-read'], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/post/timeline',               'permissions'=>['post-read'], 'Post::timeline'],
	['method'=>'post', 'endpoint'=>'/post/create',                 'permissions'=>['post-write'], 'Post::create']
];

foreach ($routes as $route)
{
	$method = $route['method'];
	$endPoint = $route['endpoint'];

	$app->$method($endPoint, function ($req, $res, $args) use($route, $endPoint)
	{
		// TODO: validate access-key

		// TODO: validate permissions
		$requirePermissions = $route['permissions'];

		if(!is_callable(current(array_slice($route, -1, 1))))
			throw new Exception("last item of route was non-callable (endpoint: $endPoint)");
		$callable = current(array_slice($route, -1, 1));

		$controllerArgs = [$req, $res, $this];

		return call_user_func_array($callable, $controllerArgs);
	});
}
