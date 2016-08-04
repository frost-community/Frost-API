<?php

class PostController
{
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['text'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		// TODO

		return withFailure($res, "not implemented.");
	}

	public static function show($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function timeline($req, $res, $container, $user, $application)
	{
		// TODO
	}
}
