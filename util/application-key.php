<?php
namespace Utility;

class ApplicationKey
{
	public static function create($userId, $name, $description, $config, DatabaseManager $db)
	{
		$now = time();

		// TODO: 既存のアプリケーションに同名のものがあれば例外

		try
		{
			$container->dbManager->executeQuery('insert into frost_application (creator_id, created_at, name, description) values(?, ?, ?, ?)', [$userId, $now, $name, $description]);
		}
		catch(PDOException $e)
		{
			throw new Exception('faild to create database record');
		}

		$application = $container->dbManager->executeQuery('select * from frost_application where creator_id = ? & name = ?', [$userId, $name])->fetch()[0];

		return $application;
	}

	public static function validate($config, DatabaseManager $db)
	{
		//TODO
	}
	
	public static function generateKey($config, DatabaseManager $db)
	{
		//TODO
	}

	public static function validateKey()
	{
		//TODO
	}
}
