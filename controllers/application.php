<?php

class Application
{
	public static function create($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['request-key', 'name', 'description'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestKey::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);
		$userId = explode('-', $params['request-key'])[0];

		try
		{
			$application = \Models\Application::create($userId, $params['name'], $params['description'], $container->config, $container->dbManager);
		}
		catch(Exception $e)
		{
			return withFailure($res, 'faild to create application', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, "successful", ['application' => $application]);
	}

	public static function regenerateKey($params, $res, $container)
	{
		$requireParams = ['request-key', 'application-id'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestKey::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);
		$userId = explode('-', $params['request-key'])[0];

		try
		{
			$application = \Models\Application::fetch($params['application-id'], $container->dbManager);
			$applicationKey = \Models\ApplicationKey::create($userId, $params['application-id'], $container->config, $container->dbManager);
		}
		catch(Exception $e)
		{
			return withFailure($res, 'faild to regenerate application-key', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['application-key'=>$applicationKey]);
	}
}
