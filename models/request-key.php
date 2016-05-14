<?php
namespace Model;

// RequestKey はFrost-Webからのアクセスのみを許可するAPIでそのリクエストが正当であるかどうかを検証するためのキーです。

class RequestKey
{
	// リクエストキーを生成します
	// 例外が発生する可能性があります
	public static function create($userId, $config, DatabaseManager $db, $requestId = null, $num = null)
	{
		$requestReceptions = $db->executeQuery('select * from frost_request_reception where user_id = ?', [$userId])->fetch();

		// すでにキーが発行済みであれば
		if (count($requestReceptions) !== 0)
		{
			$requestReception = $requestReceptions[0];

			$requestId = $requestReception['id'];
			$num = $requestReception['salt'];
		}
		else
		{
			if ($requestId === null)
			{
				do
				{
					$requestId = rand(1, 999999);
					$requestReceptions = $db->executeQuery('select * from frost_request_reception where id = ?', [$requestId])->fetch();
					$tryCount++;
					$isUsablerequestId = count($requestReceptions) === 0;
				}
				while(!$isUsablerequestId && $tryCount < 1000);

				if(!$isUsablerequestId)
					throw new Exception('faild to find usable request id');
			}

			if ($num === null)
				$num = rand(1, 99999);

			$now = time();

			try
			{
				$db->executeQuery('insert into frost_request_reception (created_at, id, user_id, salt) values (?, ?, ?, ?)', [$now, $requestId, $userId, $num]);
			}
			catch(PDOException $e)
			{
				throw new Exception('faild to create database record');
			}
		}

		return [$userId.'-'.$requestId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$requestId.$num), $requestId];
	}

	// リクエストキーを検証します
	public static function validate($requestKey, $config, DatabaseManager $db)
	{
		$match = Regex::match('/([^-]+)-([^-]+)-([^-]+)-([^-]{32})/', $userKey);

		if ($match === null)
			return false;

		$userId = $match[1];
		$requestId = $match[2];
		$num = $match[3];

		$correctRequestKey = $userId.'-'.$requestId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$requestId.$num);

		return $requestKey === $correctRequestKey;
	}

	// リクエストキーを削除します
	// 例外が発生する可能性があります
	public static function destroy($requestId, DatabaseManager $db)
	{
		try
		{
			$db->executeQuery('delete from frost_request_reception where id = ?', [$requestId]);
		}
		catch(PDOException $e)
		{
			throw new Exception('faild to destroy database record');
		}

		return true;
	}
}