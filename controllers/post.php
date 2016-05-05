<?php

require_once __DIR__.'/../util/api-exception.php';
require_once __DIR__.'/../util/api-utils.php';
require_once __DIR__.'/../util/regex.php';

class Post
{
	public static function create($req, $res, $appName, $userId, $container)
	{
		$params = $req->getParams();

		$requireParams = ['text'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		return withSuccess($res);
	}
}
