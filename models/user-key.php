<?php
namespace Models;

// UserKey は正当なユーザーによるリクエストであるかどうかを検証するために利用されるキーです。

class UserKey
{
	// ユーザーキーを生成します
	public static function create($userId, $config, $num = null)
	{
		if ($num === null)
			$num = rand(1, 99999);

		return $userId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$num);
	}

	// ユーザーキーを検証します
	public static function validate($userKey, $config)
	{
		$match = Regex::match('/([^-]+)-([^-]+)-([^-]{32})/', $userKey);

		if ($match === null)
			return false;

		$userId = $match[1];
		$num = $match[2];

		$correctUserKey = $userId.'-'.$num.'-'.hash('sha256', $config['keyBase'].$userId.$num);

		return $userKey === $correctUserKey;
	}
}
