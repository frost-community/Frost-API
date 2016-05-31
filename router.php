<?php

function indexPage ($req, $res, $container)
{
	$res->getBody()->write('Frost API Server');
	return $res;
}

$routes = [
	['method'=>'get',  'endpoint'=>'/',                            'permissions'=>[], 'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/request-key',        'permissions'=>[], 'IceAuth::requestKey'],
	['method'=>'get',  'endpoint'=>'/ice-auth/authorize',          'permissions'=>[], 'IceAuth::authorizePage'],
	['method'=>'post', 'endpoint'=>'/ice-auth/authorize',          'permissions'=>[], 'IceAuth::authorize'],
	['method'=>'get',  'endpoint'=>'/ice-auth/access-key',         'permissions'=>['internal'], 'IceAuth::accessKey'],
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
		if (count($route['permissions']) !== 0)
		{
			$params = $req->getParams();
			if (!array_key_exists('access-key', $params))
				return withFailure($res, 'access-key is missing');

			$applicationAccess = \Models\ApplicationAccess::validate($params['access-key'], $this);
			if (!$applicationAccess)
				return withFailure($res, 'access-key is invalid');

			$user = \Models\User::fetch($applicationAccess['user_id'], $this);
			$application = \Models\Application::fetch($applicationAccess['application_id'], $this);

			$permissions = explode(',', $application['permissions']);

			foreach ($route['permissions'] as $requirePermission)
			{
				if (array_key_exists($requirePermission, $permissions))
					return withFailure($res, 'You do not have some permissions.');
			}

			$controllerArgs = [$req, $res, $this, $user, $application];
		}
		else
		{
			$controllerArgs = [$req, $res, $this];
		}

		if(!is_callable(current(array_slice($route, -1, 1))))
			throw new Exception("last item of route was non-callable (endpoint: $endPoint)");
		$callable = current(array_slice($route, -1, 1));

		return call_user_func_array($callable, $controllerArgs);
	});
}
