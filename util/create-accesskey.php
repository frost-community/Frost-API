<?php

function createAccesskey($applicationId, $userId, $container)
{
	return $userId.'-'.hash('sha256', $container->config['access-key-base'].'.'.$applicationId.'.'.$userId);
}
