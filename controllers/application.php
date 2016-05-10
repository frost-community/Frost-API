<?php

class Application
{
	public static function create($params, $res, $container)
	{
		$requireParams = ['request-key', 'name', 'description'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$createdAt = time();

		if (!RequestKey::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);

		$userId = explode('-', $params['request-key']);

		try
		{
			$container->dbManager->executeQuery('insert into frost_application (creator_id, created_at, name, description) values(?, ?, ?, ?)', [$userId, $createdAt, $params['name'], $params['description']]);
			$application = $container->dbManager->executeQuery('select * from frost_application where name = ?', [$params['name']])->fetch()[0];
		}
		catch(PDOException $e)
		{
			return withFailure($res, 'faild to create application');
		}

		return withSuccess($res, "successful", ['application' => $application]);
	}

	public static function generateKey($params, $res, $container)
	{
		$requireParams = ['request-key', 'app-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestKey::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);

		$userId = explode('-', $params['request-key']);

		$applications = $container->dbManager->executeQuery('select * from frost_application where id = ? & creator_id = ?', [$params['app-id'], $userId])->fetch();
		if (count($applications) === 0)
			return withFailure($res, 'application not found');

		$application = $applications[0];

		$key = $application['id'].'-'.hash('sha256', $container->config['keyBase'].'.'.$application['id'].'.'.rand(1, 1000));

		try
		{
			$container->dbManager->executeQuery('update frost_application set key = ? where id = ?', [$key, $application['id']]);
		}
		catch(PDOException $e)
		{
			return withFailure($res, 'faild to generate application key');
		}

		return withSuccess($res,'successful', ['application-key'=>$key]);
	}
}
