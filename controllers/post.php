<?php

class Post
{
	public static function create($req, $res, $container, $user, $application)
	{
		//$appName, $userId
		$params = $req->getParams();

		$requireParams = ['text'];
		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		// TODO

		return withSuccess($res);
	}
}
