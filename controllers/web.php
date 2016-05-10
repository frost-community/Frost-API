<?php

class Web
{
	public static function createRequestKey($params, $res, $container)
	{
		$requireParams = ['user-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!UserKey::validate($params['user-key'], $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['user-key']);

		try
		{
			$requestKey = RequestKey::create($params['user-key'], $container->config, $container->dbManager);
		}
		catch(Exception $e)
		{
			return withFailure($res, 'failed to create request key', ['detail' => $e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['request-key'=>$requestKey]);
	}
}