<?php

function callApiController($req, $res, $args, $container, $callable)
{
	$accessKey = $req->getParams()['access_key'];

	if (!isset($accessKey))
		throw new ApiException('parameters are required', ['access_key']);

	$accessInstances = $container->dbManager->executeQuery('select * from frost_application_access where access_key = ? limit 1', [$accessKey])->fetch();
	$accessInstance = count($accessInstances) === 1 ? $accessInstances[0] : null;

	if (!isset($accessKey))
		throw new ApiException('parameters are invalid', ['access_key']);

	return $callable($req, $res, $args, $accessInstance['app_name'], $accessInstance['user_id'], $accessInstance['access_key'], $container);
};
