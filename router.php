<?php

/**
 * ルータを表します
 */
class Router
{
	public $slimApplication;

	/**
	 * コンストラクタ
	 */
	public function __construct(\Slim\App $app)
	{
		$this->slimApplication = $app;
	}

	/**
	 * ルートを追加します
	 */
	public function addRoute(Route $route)
	{
		$slimApplication->$route->method($route->endPoint, function ($req, $res, $args) use($route)
		{
			if (count($route->permissionsArray) !== 0)
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

				foreach ($route->permissionsArray as $permission)
				{
					if (!$application->isHasPermission($permission))
						return withFailure($res, 'You do not have some permissions.', [], 403);
				}

				$controllerArgs = [$req, $res, $this, $user, $application];
			}
			else
			{
				$controllerArgs = [$req, $res, $this];
			}

			if(!is_callable($route->callable))
				throw new \Exception("last item of route was non-callable (endpoint: $route->endPoint)");

			return call_user_func_array($route->callable, $controllerArgs);
		});
	}
}
