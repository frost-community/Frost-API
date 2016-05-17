<?php
namespace Models;

// RequestKey はFrost-Webからのアクセスのみを許可するAPIでそのリクエストが正当であるかどうかを検証するためのキーです
class RequestKey
{
	// リクエストキーを生成します
	// return: request-key
	public static function create($userId, $config, DatabaseManager $db)
	{
		$user = User::fetch($userId, $db);

		$requestHash = hash('sha256', $config['requestKeyBase'].$userId.$salt);
		
		try
		{
			$db->executeQuery('update frost_user set request_hash = ? where id = ?', [$requestHash, $userId]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to register request-key to database');
		}

		return $userId.'-'.$requestHash;
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

		$correctRequestKey = $userId.'-'.$user['request_hash'];

		return $requestKey === $correctRequestKey;
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
