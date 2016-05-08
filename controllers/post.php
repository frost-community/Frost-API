<?php

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
