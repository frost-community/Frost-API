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
	public function __construct($config)
	{
		$appConfig = [
			'settings' => [
				'displayErrorDetails' => true
			],
			'config' 	=> $config,
		];

		ORM::configure("mysql:dbname={$config['db']['dbname']};host={$config['db']['hostname']};charset=utf8");
		ORM::configure('username', $config['db']['username']);
		ORM::configure('password', $config['db']['password']);

		$this->app = new Slim\App($appConfig);
		$this->router = new Router($this->app);
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
