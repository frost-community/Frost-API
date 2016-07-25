<?php
namespace Models;

class ApplicationAccess
{
	public static function create($applicationId, $userId, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;
		$timestamp = time();
		$num = mt_rand(1, 99999);
		$hash = hash('sha256', $config['access-key-base'].'/'.$applicationId.'/'.$userId.'/'.$num);

		try
		{
			$appAccessTable = $config['db']['table-names']['application-access'];
			$db->execute("insert into $appAccessTable (created_at, user_id, application_id, hash) values(?, ?, ?, ?)", [$timestamp, $userId, $applicationId, $hash]);
		}
		catch(PDOException $e)
		{
			throw new Utility\ApiException('faild to create database record');
		}

		$access = self::fetch($applicationId, $userId, $container);

		return $access;
	}

	public static function fetch($applicationId, $userId, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		try
		{
			$appAccessTable = $config['db']['table-names']['application-access'];
			$accesses = $db->executeFetch("select * from $appAccessTable where application_id = ? & user_id = ?", [$applicationId, $userId]);
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
			$appAccessTable = $config['db']['table-names']['application-access'];
			$accesses = $db->executeFetch("select * from $appAccessTable where hash = ? and user_id = ?", [$hash, $userId]);
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
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64})/', $accessKey);

		if ($match === null)
			return false;

		$userId = $match[1];
		$hash = $match[2];

		try
		{
			return self::fetch2($userId, $hash, $container);
		}
		catch (ApiWException $e) { }

		return false;
	}
}
