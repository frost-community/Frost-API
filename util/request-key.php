<?php

require_once(__FILE__.'/regex.php');

function createRequestKey($userId, $config, DatabaseManager $db, $requestId = null, $num = null)
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
			return null;
	}

	if ($num === null)
		$num = rand(1, 99999);

	$now = time();

	try
	{
		$db->executeQuery('insert into frost_request_reception (created_at, request_id, user_id) values (?, ?, ?)', [$now, $requestId, $userId]);
	}
	catch(PDOException $e)
	{
		return null;
	}

	return $userId.'-'.$requestId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$requestId.$num);
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
