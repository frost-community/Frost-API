<?php

/* developer */

class Application
{
	public static function create($params, $res, $container)
	{
		// TODO
		// session(frost-session): [user_id]
		// params: [name, description]

		$requireParams = ['name', 'description'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$createdAt = time();

		try
		{
			$container->dbManager->executeQuery('insert into frost_application (creator_id, created_at, name, description) values(?, ?, ?, ?)', [$_SESSION['user_id'], $createdAt, $params['name'], $params['description']]);
		}
		catch(PDOException $e)
		{
			return withFailure($res, 'faild to create application');
		}

		$application = $container->dbManager->executeQuery('select * from frost_application where name = ?', [$params['name']])->fetch()[0];

		return withSuccess($res, "successful", ['application' => $application]);
	}

	public static function generateKey($params, $res, $container)
	{
		// TODO
		// session(frost-session): [user_id]
		// params: [app_id]

		$requireParams = ['app_id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$applications = $container->dbManager->executeQuery('select * from frost_application where id = ? & creator_id = ?', [$params['app_id'], $_SESSION['user_id']])->fetch();

		if (count($applications) === 0)
			return withFailure($res, 'application not found');

		$application = $applications[0];

		$key = $application['id'].'-'.hash('sha256', $container->config['application_key_base'].'.'.$application['id'].'.'.rand(1, 1000));

		try
		{
			$container->dbManager->executeQuery('update frost_application set key = ? where id = ?', [$key, $application['id']]);
		}
		catch(PDOException $e)
		{
			return withFailure($res, 'faild to generate application key');
		}

		return withSuccess($res);
	}
}
