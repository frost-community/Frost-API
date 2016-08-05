<?php

class ApplicationController
{
	public static function create(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['name', 'description', 'permissions'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$app = ApplicationModel::createInstance($user['id'], $params['name'], $params['description'], $splitedPermissions, $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application' => $app->toArrayResponse()]);
	}

	public static function show($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function applicationKey(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$app = ApplicationModel::getInstance($params['application-id'], $container);
			$applicationKey = $app->applicationKey($user->id);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application-key'=>$applicationKey]);
	}

	public static function applicationKeyGenerate( \Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$app = ApplicationModel::getInstance($params['application-id'], $container);
			$applicationKey = $app->generateKey($user->id);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application-key'=>$applicationKey]);
	}
}
