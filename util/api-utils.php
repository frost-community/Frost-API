<?php

/* API Response Builder */
function withFailure($res, $message, $content = null, $httpStatus = 400)
{
	$src['error']['message'] = $message;

	if (isset($content))
		$src['error']['data'] = $content;

	return $res->withJson($src, $httpStatus);
}

function withSuccess($res, $content = null, $message = 'successful')
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
		throw new Utility\ApiException(3);
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
