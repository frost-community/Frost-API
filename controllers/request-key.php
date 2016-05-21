<?php

class RequestKey
{
	public static function create($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['user-key'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!UserKey::validate($params['user-key'], $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['user-key']);
		$userId = explode('-', $params['request-key'])[0];

		try
		{
			$requestKey = \Models\RequestKey::create($userId, $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, 'failed to create request-key', ['detail' => $e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['request-key'=>$requestKey]);
	}
}
