<?php

class Application
{
	// TODO: サードパーティアプリへのinternal権限設定の禁止
	public static function create($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['name', 'description', 'permissions'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$application = \Models\Application::create($userId, $params['name'], $params['description'], $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, 'faild to create application', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, "successful", ['application' => $application]);
	}

	public static function applicationKey($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['request-key', 'application-id'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Request::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);
		$userId = explode('-', $params['request-key'])[0];

		try
		{
			$applicationKey = \Models\ApplicationKey::fetch($userId, $params['application-id'], $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, 'faild to show application-key', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['application-key'=>$applicationKey]);
	}

	public static function regenerateKey($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['request-key', 'application-id'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Request::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);
		$userId = explode('-', $params['request-key'])[0];

		try
		{
			$application = \Models\Application::fetch($params['application-id'], $container->dbManager);
			$applicationKey = \Models\ApplicationKey::create($userId, $params['application-id'], $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, 'faild to regenerate application-key', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['application-key'=>$applicationKey]);
	}
}
