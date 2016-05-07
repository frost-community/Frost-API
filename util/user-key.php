<?php

require_once(__FILE__.'/regex.php');

function createUserKey($userId, $config, $num = null)
{
	if ($num === null)
		$num = rand(1, 99999);

	return $userId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$num);
}

function validateUserKey($userKey, $config)
{
	$match = Regex::match('/([^-]+)-([^-]+)-([^-]{32})/', $userKey);

	if ($match === null)
		return false;

	$userId = $match[1];
	$num = $match[2];

	$correctUserKey = $userId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$num);

	return $userKey === $correctUserKey;
}
