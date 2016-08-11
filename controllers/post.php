<?php

class PostController
{
	public static function statusCreate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		// requireParams: text

		// TODO

		return withFailure($res, "not implemented.");
	}

	public static function articleCreate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		// requireParams: text

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
