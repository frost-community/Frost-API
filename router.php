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

			if (!ApplicationAccessModel::verifyKey($params['access-key'], $this))
				return withFailure($res, 'access-key is invalid');

			$parseResult = ApplicationAccessModel::parseKeyToArray($params['access-key']);
			$access = ApplicationAccessModel::getInstanceWithFilters(['user_id' => $parseResult['id'], 'key_code' => $parseResult['keyCode']], $this);
			$user = $access->user();
			$application = $access->application();

			foreach ($route[2] as $requirePermission)
			{
				if (!$application->isHasPermission($requirePermission))
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
