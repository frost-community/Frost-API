<?php

/**
 * ルータの項目を表します
 */
class Route
{
	public $method;
	public $endPoint;
	public $permissionsArray;
	public $callable;

	/**
	 * コンストラクタ
	 */
	public function __construct($method, $endPoint, array $permissionsArray, $callableString)
	{
		$this->method = $method;
		$this->endPoint = $endPoint;
		$this->permissionsArray = $permissionsArray;
		$this->callable = $callableString;
	}
}
