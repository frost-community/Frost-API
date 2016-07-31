<?php

class UserData extends \Model
{
	public static $_table = 'test_user';
	public static $_id_column = 'id';

	public function applications()
	{
		return $this->belongs_to('ApplicationData', 'id');
	}

	public function applicationAccesses()
	{
		return $this->belongs_to('ApplicationAccessData', 'id');
	}
}
