<?php
namespace Models;

class ApplicationAccess
{
	public static function create($userId, $applicationId, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		$time = time();

		$num = rand(1, 99999);
		$hash = hash('sha256', $config['access-key-base'].$applicationId.$userId.$num);

		try
		{
			$db->executeQuery('insert into frost_application_access (created_at, user_id, application_id, hash) values(?, ?, ?, ?)', [$time, $userId, $applicationId, $hash]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$access = fetch($applicationId, $userId, $config, $db);

		return $access;
	}

	public static function fetch($applicationId, $userId, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		try
		{
			$accesses = $db->executeQuery('select * from frost_application_access where application_id = ? & user_id = ?', [$applicationId, $userId])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application access');
		}

		if (count($accesses) === 0)
			throw new ApiException('application access not found');

		$access = $accesses[0];

		return $accesses[0];
	}

	public static function fetch2($userId, $hash, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		try
		{
			$accesses = $db->executeQuery('select * from frost_application_access where hash = ? & user_id = ?', [$hash, $userId])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application access');
		}

		if (count($accesses) === 0)
			throw new ApiException('application access not found');

		return $accesses[0];
	}

	public static function buildKey($userId, $hash)
	{
		return $userId.'-'.$hash;
	}

	public static function validate($accessKey, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		$match = Regex::match('/([^-]+)-([^-]{32})/', $accessKey);

		if ($match === null)
			throw false;

		$userId = $match[1];
		$hash = $match[2];

		try
		{
			return self::fetch2($userId, $hash, $config, $db);
		}
		catch (Exception $e)
		{
		}

		return false;
	}
}
