<?php
namespace Models;

// RequestKey はFrost-Webからのアクセスのみを許可するAPIでそのリクエストが正当であるかどうかを検証するためのキーです
class RequestKey
{
	// リクエストキーを生成します
	// return: request-key
	public static function create($config, DatabaseManager $db)
	{
		$num = rand(1, 99999);
		$time = time();

		$hash = hash('sha256', $config['request-key-base'].$num.$time);

		try
		{
			$db->executeQuery('insert into frost_request (hash, created_at) values(?, ?)', [$hash, $time]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record', ['request-key']);
		}

		return "$time-$hash";
	}

	// リクエストキーを検証します
	// return: 与えられたリクエストキーが有効かどうか
	public static function validate($requestKey, $config, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $requestKey);

		if ($match === null)
			return false;

		$time = $match[1];
		$requestHash = $match[2];

		try
		{
			try
			{
				$requests = $db->executeQuery('select * from frost_request where hash = ? & created_at = ?', [$requestHash, $time])->fetch();
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

	// リクエストキーを削除します
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
