<?php
namespace Models;

class RequestKey
{
	public static function create($applicationKey, $config, DatabaseManager $db)
	{
		$num = rand(1, 99999);
		$time = time();

		$key = $time.'-'.$num.'-'.hash('sha256', $config['request-key-base'].$applicationKey.$time.$num);

		try
		{
			$db->executeQuery('insert into frost_request (created_at, application_key, key) values(?, ?, ?)', [$time, $applicationKey, $key]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record', ['request-key']);
		}

		return $key;
	}

	public static function validate($requestKey, $config, DatabaseManager $db)
	{
		try
		{
			try
			{
				$requests = $db->executeQuery('select * from frost_request where key = ?', [$requestKey])->fetch();
			}
			catch(PDOException $e)
			{
				throw new ApiException('faild to fetch request');
			}

			if (count($requests) === 0)
				throw new ApiException('request not found');

			$request = $requests[0];
		}
		catch(Exception $e)
		{
			return false;
		}

		return abs(time() - $request['created_at']) < $config['request-key-expire-sec'];
	}

	public static function destroy($requestKey, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $requestKey);

		if ($match === null)
			throw new ApiException('invalid format', ['request-key']);

		$time = $match[1];

		try
		{
			$db->executeQuery('update frost_user set request_hash = ? where id = ?', [null, $userId]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to destroy database record');
		}

		return true;
	}
}
