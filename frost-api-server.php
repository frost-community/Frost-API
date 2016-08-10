<?php

/**
 * APIサーバーを表します
 */
class FrostAPIServer
{
	public $app;
	public $router;

	/**
	 * コンストラクタ
	 */
	public function __construct(Slim\App $app, Router $router)
	{
		$this->app = $app;
		$this->router = $router;
	}

	/**
	 * ルートを追加します
	 */
	public function addRoute(Route $route)
	{
		$this->router->addRoute($route);
	}

	/**
	 * サーバの処理を呼び出します
	 */
	public function executeServer()
	{
		$this->app->run();
	}
}
