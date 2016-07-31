<?php

class ApplicationAccessData extends Model
{
	public static $_table = 'test_application_access';
	public static $_id_column = 'id';

	public function application()
	{
		return $this->has_one('ApplicationData', 'id');
	}

	public function user()
	{
		return $this->has_one('UserData', 'id');
	}
}
