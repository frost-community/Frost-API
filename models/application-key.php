<?php
namespace Models;

class ApplicationKey
{
	public static function create($userId, $applicationId, $config, DatabaseManager $db)
	{
		try
		{
			$applications = $db->executeQuery('select * from frost_application where id = ?', [$applicationId])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to search database record');
		}

		if (count($applications) === 0)
			throw new ApiException('application not found');

		$application = $applications[0];
		$num = rand(1, 99999);
		$key = $userId.'-'.hash('sha256', $config['applicationKeyBase'].$userId.$applicationId.$num);

		try
		{
			$container->dbManager->executeQuery('update frost_application set key = ? where id = ?', [$key, $applicationId]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to generate application key');
		}

		return $key;
	}

	public static function validate($applicationKey, $config, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $applicationKey);

		if ($match === null)
			return false;

		$userId = $match[1];

		try
		{
			$applications = $db->executeQuery('select * from frost_application where id = ? & creator_id = ?', [$applicationId, $userId])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to search database record');
		}

		return count($applications) !== 0;
	}
}
