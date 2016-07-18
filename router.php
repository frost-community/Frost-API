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
	['method'=>'post', 'endpoint'=>'/account/create',              'permissions'=>['internal'], 'User::create'],
	['method'=>'post', 'endpoint'=>'/application/create',          'permissions'=>['internal'], 'Application::create'],
	['method'=>'get',  'endpoint'=>'/application/application-key', 'permissions'=>['internal'], 'Application::applicationKey'],
	['method'=>'post', 'endpoint'=>'/application/regenerate-key',  'permissions'=>['internal'], 'Application::regenerateKey'],
	['method'=>'get',  'endpoint'=>'/user',                        'permissions'=>['user-read'], 'User::show'],
	['method'=>'get',  'endpoint'=>'/user/timeline',               'permissions'=>['user-read'], 'User::timeline'],
	['method'=>'post', 'endpoint'=>'/post/create',                 'permissions'=>['post-write'], 'Post::create'],
	['method'=>'get',  'endpoint'=>'/post/timeline',               'permissions'=>['post-read'], 'Post::timeline']
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

			if (isset($applicationAccess['user_id']))
				$userId = $applicationAccess['user_id'];

			if (isset($applicationAccess['application_id']))
				$applicationId = $applicationAccess['application_id'];

			$permissionsStr = $application['permissions'];

			$user = \Models\User::fetch($userId, $this);
			$application = \Models\Application::fetch($applicationId, $this);

			$permissions = explode(',', $permissionsStr);

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

		// last element
		$callable = current(array_slice($route, -1, 1));

		if(!is_callable($callable))
			throw new Exception("last item of route was non-callable (endpoint: $endPoint)");

		return call_user_func_array($callable, $controllerArgs);
	});
}
