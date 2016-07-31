<?php

class RequestData extends \Model
{
	public static $_table = 'test_request';
	public static $_id_column = 'id';

	public function application()
	{
		return $this->has_one('ApplicationData', 'id');
	}
}
