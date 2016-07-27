<?php
namespace Models;

class ApplicationAccess
{
	public static function create($applicationId, $userId, $container)
	{
		$timestamp = time();
		$num = mt_rand(1, 99999);
		$hash = strtoupper(hash('sha256', $container->config['access-key-base'].'/'.$applicationId.'/'.$userId.'/'.$num));

		try
		{
			$appAccessTable = $container->config['db']['table-names']['application-access'];
			$container->dbManager->execute("insert into $appAccessTable (created_at, user_id, application_id, hash) values(?, ?, ?, ?)", [$timestamp, $userId, $applicationId, $hash]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to create database record');
		}

		$access = self::fetch($applicationId, $userId, $container);

		return $access;
	}

	public static function fetch($applicationId, $userId, $container)
	{
		try
		{
			$appAccessTable = $container->config['db']['table-names']['application-access'];
			$accesses = $container->dbManager->executeFetch("select * from $appAccessTable where application_id = ? & user_id = ?", [$applicationId, $userId]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch application access');
		}

		if (count($accesses) === 0)
			throw new \Utility\ApiException('application access not found');

		$access = $accesses[0];

		return $accesses[0];
	}

	public static function fetch2($userId, $hash, $container)
	{
		try
		{
			$appAccessTable = $container->config['db']['table-names']['application-access'];
			$accesses = $container->dbManager->executeFetch("select * from $appAccessTable where hash = ? and user_id = ?", [$hash, $userId]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch application access');
		}

		if (count($accesses) === 0)
			throw new \Utility\ApiException('application access not found');

		return $accesses[0];
	}

	public static function buildKey($userId, $hash)
	{
		return $userId.'-'.$hash;
	}

	public static function validate($accessKey, $container)
	{
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
