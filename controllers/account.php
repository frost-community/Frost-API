<?php

class Account
{
	public static function create($req, $res, $appName, $userId, $container)
	{
		$params = $req->getParams();

		$requireParams = ['screen-name', 'password'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$account = User::create($params['screen-name'], $params['password'], 'froster', $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess('successful', ['account'=>$account]);
	}
}
