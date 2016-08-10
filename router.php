<?php

/**
 * ルータを表します
 */
class Router
{
	public $slimApplication;
	public $container;

	/**
	 * コンストラクタ
	 */
	public function __construct(\Slim\App $app, $container)
	{
		$this->slimApplication = $app;
		$this->container = $container;
	}

	/**
	 * ルートを追加します
	 */
	public function addRoute(\Route $route)
	{
		$method = $route->method;
		$container = $this->container;

		$this->slimApplication->$method($route->endPoint, function ($req, $res, $args) use($route, $container)
		{
			if (count($route->permissionsArray) !== 0)
			{
				$params = $req->getParams();

				if (!array_key_exists('access-key', $params))
					return withFailure($res, 'access-key is missing');

				if (!ApplicationAccessModel::verifyKey($params['access-key'], $container))
					return withFailure($res, 'access-key is invalid');

				// 権限を所持しているかどうかを確認

				$accessFactory = new ApplicationAccessFactory($container['database'], $container['config'], new \Utility\Regex());
				$keyElements = $accessFactory->parseKeyToArray($params['access-key']);
				$accessData = $accessFactory->findOneWithFilters(['user_id' => $keyElements['id'], 'key_code' => $keyElements['keyCode']]);

				foreach ($route->permissionsArray as $permission)
				{
					if (!$accessData->application()->isHasPermission($permission))
						return withFailure($res, 'You do not have some permissions.', [], 403);
				}

				$controllerArgs = [$req, $res, $container, $accessData->user(), $accessData->application()];
			}
			else
			{
				$controllerArgs = [$req, $res, $container];
			}

			if(!is_callable($route->callable))
				throw new \Exception("last item of route was non-callable (endpoint: $route->endPoint)");

			return call_user_func_array($route->callable, $controllerArgs);
		});
	}
}
