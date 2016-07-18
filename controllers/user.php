<?php

class User
{
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();

		$requireParams = ['screen-name', 'password'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$account = \Models\User::create($params['screen-name'], $params['password'], 'froster', $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess('successful', ['account'=>$account]);
	}

	public static function show($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();

		$requireParams = ['user-id'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$user = \Models\User::fetch($params['user-id'], $container);

		return withSuccess('successful', ['user'=>$user]);
	}
}
