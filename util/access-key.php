<?php

function createAccesskey($applicationId, $userId, $container)
{
	return $userId.'-'.hash('sha256', $container->config['keyBase'].$applicationId.$userId);
}
