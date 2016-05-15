<?php
namespace Models;

// TODO
class Accesskey
{
	public static function create($userId, $applicationId, $container)
	{
		return $userId.'-'.hash('sha256', $container->config['keyBase'].$applicationId.$userId);
	}
}
