<?php
namespace Models;

// RequestKey はFrost-Webからのアクセスのみを許可するAPIでそのリクエストが正当であるかどうかを検証するためのキーです
class RequestKey
{
	// リクエストキーを生成します
	// return: request-key
	public static function create($userKey, $config, DatabaseManager $db)
	{
		if (!UserKey::validate($userKey))
			throw new ApiException('user-key is invalid');

		$num = rand(1, 99999);
		$time = time();

		$hash = hash('sha256', $config['request-key-base'].$userId.$num.$time);

		try
		{
			$db->executeQuery('update frost_user set request_hash = ? where id = ?', [$hash, $userId]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to register request-key to database');
		}

		return "$userId-$time-$hash";
	}

	// リクエストキーを検証します
	// return: 与えられたリクエストキーが有効かどうか
	public static function validate($requestKey, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $requestKey);

		if ($match === null)
			return false;

		$userId = $match[1];
		$requestHash = $match[2];

		try
		{
			$user = User::fetch($userId, $db);
		}
		catch(Exception $e)
		{
			return false;
		}

		if ($user['request_hash'] == null)
			return false;

		return $requestHash === $user['request_hash'];
	}

	// リクエストキーを削除します
	public static function destroy($requestKey, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]{32})/', $requestKey);

		if ($match === null)
			return false;

		$userId = $match[1];

		try
		{
			$db->executeQuery('update frost_user set request_hash = ? where id = ?', [null, $userId]);
		}
		catch(PDOException $e)
		{
			throw new Exception('faild to destroy database record');
		}

		return true;
	}
}
