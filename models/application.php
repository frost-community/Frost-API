<?php
namespace Models;

class Application
{
	// 権限一覧
	public static $permissionTypes = [
		'internal-access',
		'account-access',
		'user-read',
		'post-read',
		'post-write',
	];

	public static function create($userId, $name, $description, array $permissions, $config, DatabaseManager $db)
	{
		$now = time();

		foreach ($permissions as $permission)
		{
			$isFound = false;
			for ($i=0; $i < count($permissionTypes); $i++)
			{
				if($permission === $permissionTypes[$i])
				{
					$isFound = true;
					break;
				}
			}

			if (!$isFound)
				throw new ApiException('unknown permission', [$permission]);
		}

		try
		{
			$application = Application::fetchByName($name);
		}
		catch(ApiException $e)
		{
		}

		if (isset($application))
			throw new ApiException('already exists.');

		try
		{
			$db->executeQuery('insert into frost_application (creator_id, created_at, name, description, permissions) values(?, ?, ?, ?)', [$userId, $now, $name, $description, implode(',', $permissions)]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$application = $db->executeQuery('select * from frost_application where creator_id = ? & name = ?', [$userId, $name])->fetch()[0];

		$key = ApplicationKey::create($application['id'], $config, $db);

		$application['key'] = $key;

		return $application;
	}

	public static function fetch($id, DatabaseManager $db)
	{
		try
		{
			$apps = $db->executeQuery('select * from frost_application where id = ?', [$id])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new ApiException('application not found');

		return $apps[0];
	}

	public static function fetchByName($name, DatabaseManager $db)
	{
		try
		{
			$apps = $db->executeQuery('select * from frost_application where name = ?', [$name])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new ApiException('application not found');

		return $apps[0];
	}
}
