<?php

class ApplicationController
{
	public static function create(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();

		try
		{
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], new \Utility\Regex());
			$applicationModel = new ApplicationModel($applicationFactory);
			$application = $applicationModel->create($user->record->id, $params['name'], $params['description'], $params['permissions']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application' => $application]);
	}

	public static function show(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], new \Utility\Regex());
			$applicationModel = new ApplicationModel($applicationFactory);
			$application = $applicationModel->get($urlArguments['id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application' => $application]);
	}

	public static function applicationKeyGenerate(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], new \Utility\Regex());
			$applicationModel = new ApplicationModel($applicationFactory);
			$applicationKey = $applicationModel->keyGenerate($urlArguments['id'], $user->record->id);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application-key'=>$applicationKey]);
	}

	public static function applicationKeyShow(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], new \Utility\Regex());
			$applicationModel = new ApplicationModel($applicationFactory);
			$applicationKey = $applicationModel->keyGet($urlArguments['id'], $user->record->id);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['application-key'=>$applicationKey]);
	}
}
