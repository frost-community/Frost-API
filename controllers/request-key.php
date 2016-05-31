<?php

class RequestKey
{
	public static function create($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['application-key'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$requestKey = \Models\Request::create($params['application-key'], $container->config, $container->dbManager);
		}
		catch(ApiException $e)
		{
			return withFailure($res, 'failed to create request-key', ['detail' => $e->getMessage()]);
		}

		return withSuccess($res, 'successful', ['request-key'=>$requestKey]);
	}
}
