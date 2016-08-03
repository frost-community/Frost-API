<?php

class ApplicationData extends Model
{
	public static $_table = 'frost_application';
	public static $_id_column = 'id';

	public function requests()
	{
		return $this->belongs_to('RequestData', 'id');
	}

	public function accesses()
	{
		return $this->belongs_to('ApplicationAccessData', 'id');
	}
}
