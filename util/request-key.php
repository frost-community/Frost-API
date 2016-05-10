<?php

// RequestKey はFrost-Webからのアクセスのみを許可するAPIでそのリクエストが正当であるかどうかを検証するためのキーです。
// ここではそのキーを生成・検証・削除するための関数を提供します。

function createRequestKey($userId, $config, DatabaseManager $db, $requestId = null, $num = null)
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
				throw new Exception('faild to create request-key');
		}

		if ($num === null)
			$num = rand(1, 99999);

		$now = time();

		$db->executeQuery('insert into frost_request_reception (created_at, id, user_id, salt) values (?, ?, ?, ?)', [$now, $requestId, $userId, $num]);
	}

	return [$userId.'-'.$requestId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$requestId.$num), $requestId];
}

function validateRequestKey($requestKey, $config, DatabaseManager $db)
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

function destroyRequestKey(DatabaseManager $db, $requestId = null)
{
	$db->executeQuery('delete from frost_request_reception where id = ?', [$requestId]);

	return true;
}
