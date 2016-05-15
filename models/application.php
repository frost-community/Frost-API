<?php
namespace Models;

class Application
{
	public static function create($userId, $name, $description, $config, DatabaseManager $db)
	{
		$now = time();

		try
		{
			$applications = $container->dbManager->executeQuery('select * from frost_application where name = ?', [$name])->fetch();
		}
		catch(PDOException $e)
		{
			throw new Exception('faild to search database record');
		}

		if (count($applications) !== 0)
			throw new Exception('already exists.');

		try
		{
			$container->dbManager->executeQuery('insert into frost_application (creator_id, created_at, name, description) values(?, ?, ?, ?)', [$userId, $now, $name, $description]);
		}
		catch(PDOException $e)
		{
			throw new Exception('faild to create database record');
		}

		$application = $container->dbManager->executeQuery('select * from frost_application where creator_id = ? & name = ?', [$userId, $name])->fetch()[0];

		$key = ApplicationKey::create($application['id'], $config, $db);

		$application['key'] = $key;

		return $application;
	}
}
