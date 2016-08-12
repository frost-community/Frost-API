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
			$container['url-arguments'] = $args;

			if (count($route->permissionsArray) !== 0)
			{
				$applicationKey = $req->getHeaderLine('application-key');
				$accessKey = $req->getHeaderLine('access-key');

				if (!$applicationKey)
					return withFailure($res, 'application-key header is empty');

				if (!$accessKey)
					return withFailure($res, 'access-key header is empty');

				$regex = new \Utility\Regex();
				$applicationFactory = new ApplicationFactory($container['database'], $container['config'], $regex);
				$userFactory = new UserFactory($container['database'], $container['config'], $regex);
				$accessFactory = new ApplicationAccessFactory($container['database'], $container['config'], $regex);

				if (!$applicationFactory->verifyKey($applicationKey))
					return withFailure($res, 'application-key header is invalid');

				if (!$accessFactory->verifyKey($accessKey))
					return withFailure($res, 'access-key header is invalid');

				$keyElements = $accessFactory->parseKeyToArray($accessKey);
				$applicationAccessData = $accessFactory->findOneWithFilters(['user_id' => $keyElements['id'], 'key_code' => $keyElements['keyCode']]);

				if (!$applicationAccessData->record)
					return withFailure($res, 'access-key header is invalid');

				$applicationData = $applicationAccessData->application($applicationFactory);
				$userData = $applicationAccessData->user($userFactory);

				// 権限を所持しているかどうかを確認
				foreach ($route->permissionsArray as $permission)
				{
					if (!$applicationData->isHasPermission($permission))
						return withFailure($res, 'You do not have some permissions.', [], 403);
				}

				$controllerArgs = [$req, $res, $container, $userData, $applicationData];
			}
			else
			{
				$controllerArgs = [$req, $res, $container];
			}

			return call_user_func_array($route->callable, $controllerArgs);
		});
	}
}
