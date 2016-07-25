<?php

class Application
{
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['name', 'description', 'permissions'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$destApp = \Models\Application::create($user['id'], $params['name'], $params['description'], $container->config, $container->dbManager);
		}
		catch(Utility\ApiException $e)
		{
			return withFailure($res, 'faild to create application', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, ['application' => $destApp]);
	}

	public static function applicationKey($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$app = \Models\Application::fetch($params['application-id'], $container);
			$destAppKey = \Models\Application::buildKey($params['application-id'], $app['hash']);
		}
		catch(Utility\ApiException $e)
		{
			return withFailure($res, 'faild to show application-key', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, ['application-key'=>$destAppKey]);
	}

	public static function regenerateKey($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$destAppKey = \Models\Application::generateKey($params['application-id'], $user['id'], $container);
		}
		catch(Utility\ApiException $e)
		{
			return withFailure($res, 'faild to regenerate application-key', ['detail'=>$e->getMessage()]);
		}

		return withSuccess($res, ['application-key'=>$destAppKey]);
	}
}
