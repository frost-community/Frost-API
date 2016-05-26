<?php
namespace Models;

class ApplicationAccess
{
	public static function create($userId, $applicationId, $config, DatabaseManager $db)
	{
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

		return ['application-key' => $userId.'-'.$hash];
	}

	public static function fetch($applicationId, $userId, $config, DatabaseManager $db)
	{
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

		return ['application-access'=>$accesses[0]];
	}

	public static function fetchByKey($accessKey, $config, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $accessKey);

		if ($match === null)
			throw new ApiException('invalid format', ['access-key']);

		$userId = $match[1];
		$hash = $match[2];

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

		return ['application-access'=>$accesses[0]];
	}

	public static function validate($accessKey, $config, DatabaseManager $db)
	{
		try
		{
			self::fetchByKey($accessKey, $config, $db);
		}
		catch (Exception $e)
		{
			return false;
		}

		return true;
	}
}
