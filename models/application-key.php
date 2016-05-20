<?php
namespace Models;

class ApplicationKey
{
	public static function create($userId, $applicationId, $config, DatabaseManager $db)
	{
		$application = Application::fetch($applicationId, $db);

		$num = rand(1, 99999);
		$hash = hash('sha256', $config['application-key-base'].$userId.$applicationId.$num);

		try
		{
			$container->dbManager->executeQuery('update frost_application set hash = ? where id = ?', [$hash, $applicationId]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to generate application-key');
		}

		return $applicationId.'-'.$hash;
	}

	public static function fetch($userId, $applicationId, $config, DatabaseManager $db)
	{
		try
		{
			$application = Application::fetch($applicationId, $db);
		}
		catch (Exception $e)
		{
			throw new ApiException('faild to generate application-key');
		}

		if ($application['hash'] === null)
			throw new ApiException('application-key is empty');

		return $applicationId.'-'.$application['hash'];
	}

	public static function validate($applicationKey, $config, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $applicationKey);

		if ($match === null)
			return false;

		$applicationId = $match[1];
		$hash = $match[2];

		try
		{
			$application = Application::fetch($applicationId, $db);
		}
		catch (Exception $e)
		{
			return false;
		}

		return $hash === $application['hash'];
	}
}
