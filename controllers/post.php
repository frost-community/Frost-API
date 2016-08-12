<?php

class PostController
{
	public static function statusCreate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		// requireParams: text

		// TODO

		return withSuccess($res, ["status" => null]);
	}

	public static function articleCreate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		// requireParams: title, text, description

		// TODO

		return withSuccess($res, ["article" => null]);
	}

	public static function show($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		// TODO

		// return withSuccess($res, ["status" => null]);
		// return withSuccess($res, ["post" => null]);
	}

	public static function timeline($req, $res, $container, $user, $application)
	{
		// TODO
	}
}
