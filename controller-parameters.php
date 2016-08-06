<?php

/**
 * コントローラメソッドのパラメータを表します
 */
class ControllerParameters
{
	public $request;
	public $response;
	public $container;
	public $user;
	public $application;

	public function __construct($request, $response, $container, $user = null, $application = null)
	{
		$this->request = $request;
		$this->response = $response;
		$this->container = $container;
		$this->user = $user;
		$this->application = $application;
	}
}
