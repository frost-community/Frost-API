<?php

class ApplicationController
{
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['name', 'description', 'permissions'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$app = \Models\ApplicationModel::createRecord($res, $user['id'], $params['name'], $params['description'], $splitedPermissions, $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess($res, ['application' => $app->toArrayResponse()]);
	}

	public static function applicationKey($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$appData = Model::factory('ApplicationData')->find_one($params['application-id']);
			$app = new \Models\ApplicationModel($appData, $container);
			$appKey = $app->getKey($user['id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess($res, ['application-key'=>$appKey]);
	}

	public static function applicationKeyGenerate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$appData = Model::factory('ApplicationData')->find_one($params['application-id']);
			$app = new \Models\ApplicationModel($appData, $container);
			$appKey = $app->generateKey($user['id'], $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess($res, ['application-key'=>$appKey]);
	}
}
