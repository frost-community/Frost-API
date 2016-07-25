<?php

require_once(__DIR__.'/routes.php');

foreach ($routes as $route)
{
	$method = $route[0];
	$endPoint = $route[1];

	$app->$method($endPoint, function ($req, $res, $args) use($route, $endPoint)
	{
		if (count($route[2]) !== 0)
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

			$application = \Models\Application::fetch($applicationId, $this);
			$permissionsStr = $application['permissions'];
			$user = \Models\User::fetch($userId, $this);
			$permissions = explode(',', $permissionsStr);

			foreach ($route[2] as $requirePermission)
			{
				if (!in_array($requirePermission, $permissions))
					return withFailure($res, 'You do not have some permissions.');
			}

			$controllerArgs = [$req, $res, $this, $user, $application];
		}
		else
		{
			$controllerArgs = [$req, $res, $this];
		}

		$callable = $route[3];

		if(!is_callable($callable))
			throw new Exception("last item of route was non-callable (endpoint: $endPoint)");

		return call_user_func_array($callable, $controllerArgs);
	});
}
