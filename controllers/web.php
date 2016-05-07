<?php

class Web
{
	public static function requestId($params, $res, $container)
	{
		$requireParams = ['user-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);
	}
}