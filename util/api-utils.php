<?php

/* API Response Builder */
function withFailure($res, $message, $content = null, $httpStatus = 400)
{
	$src['error']['message'] = $message;

	if (isset($content))
		$src['error']['data'] = $content;

	return $res->withJson($src, $httpStatus);
}

function withSuccess($res, $message = 'successful', $content = null)
{
	$src['message'] = $message;
	
	if (isset($content))
		$src['data'] = $content;

	return $res->withJson($src, 200);
}

/* Validate Referer */
function validateReferer($req)
{
	$referer = $req->getHeader('Referer');
	if ($referer === null || $referer === '')
	{
		throw new ApiException(3);
	}

	return true;
}

/* Validate Api Parameters */
function hasRequireParams($params, $requireParams)
{
	foreach($requireParams as $requireParam)
		if (!array_key_exists($requireParam, $params))
			return false;

	return true;
}

function callApiController($req, $res, $args, $container, $callable)
{
	$accessKey = $req->getParams()['access_key'];

	if (!isset($accessKey))
		throw new ApiException('parameters are required', ['access_key']);

	$applicationAccesses = $container->dbManager->executeQuery('select * from frost_application_access where access_key = ? limit 1', [$accessKey])->fetch();
	$applicationAccess = count($applicationAccesses) === 1 ? $applicationAccesses[0] : null;

	if (!isset($accessKey))
		throw new ApiException('parameters are invalid', ['access_key']);

	return $callable($req, $res, $args, $$applicationAccess['app_name'], $$applicationAccess['user_id'], $$applicationAccess['access_key'], $container);
};
