<?php

/**
 * ユーザーのインスタンスを管理します
 */
class UserModel extends Model
{
	public static $_table = 'frost_user';
	public static $_id_column = 'id';

	/**
	 * コンテナー
	 */
	private $container;

	/**
	 * データベースのレコードを作成し、インスタンスを取得します
	 */
	public static function createInstance($screenName, $password, $name, $container)
	{
		if ($screenName === null || $password === null || $name === null || $container === null)
			throw new \Exception('some arguments are empty');

		$timestamp = time();

		$user = self::create();
		$user->container = $container;

		$isOccurredError = false;
		$errorTargets = [];

		if (!\Utility\Regex::isMatch('/^[a-z0-9_]{4,15}$/i', $screenName) || \Utility\Regex::isMatch('/^(.)\1{3,}$/', $screenName))
		{
			$isOccurredError = true;
			$errorTargets[] = 'screen-name';
		}
		else
		{
			if (self::getInstanceWithFilters(['screen_name', $screenName], $container))
			{
				$isOccurredError = true;
				$errorTargets[] = 'screen-name';
			}
			else
			{
				foreach ($container->config['invalid-screen-names'] as $invalidScreenName)
				{
					if ($screenName === $invalidScreenName)
					{
						$isOccurredError = true;
						$errorTargets[] = 'screen-name';
					}
				}
			}
		}

		if (!\Utility\Regex::isMatch('/^[a-z0-9_-]{6,128}$/i', $password))
		{
			$isOccurredError = true;
			$errorTargets[] = 'password';
		}

		if ($isOccurredError)
			throw new \Utility\ApiException('parameters are invalid', $errorTargets);

		$user->created_at = $timestamp;
		$user->screen_name = $screenName;
		$user->name = $name;
		$user->password_hash = hash('sha256', $password.$timestamp);
		$user->save();

		return $user;
	}

	private static function getQueryWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('some arguments are empty');

		$query = Model::factory(__class__);

		foreach($wheres as $key => $value)
			$query = $query->where($key, $value);

		return $query;
	}

	public static function getInstanceWithFilters(array $wheres, $container)
	{
		if ($container === null)
			throw new \Exception('some arguments are empty');

		$query = self::getQueryWithFilters($wheres);
		$instance = $query->find_one();

		if (!$instance)
			throw new \Utility\ApiException('not found', [], 404);

		$instance->container = $container;

		return $instance;
	}

	public static function getInstancesWithFilters(array $wheres, $container)
	{
		if ($container === null)
			throw new \Exception('some arguments are empty');

		$query = self::getQueryWithFilters($wheres);
		$instance = $query->find_many();

		if (count($instance) == 0)
			throw new \Utility\ApiException('not found', [], 404);

		$instance->container = $container;

		return $instance;
	}

	public static function getInstance($id, $container)
	{
		return self::getInstanceWithFilters(['id'=>$id], $container);
	}

	/**
	 * アプリケーションを取得します
	 */
	public function applications()
	{
		return ApplicationModel::where('user_id', $this->id)->find_many();
	}

	/**
	 * アプリケーションアクセスを取得します
	 */
	public function applicationAccesses()
	{
		return ApplicationAccessModel::where('user_id', $this->id)->find_many();
	}

	/**
	 * レスポンス向けの配列データに変換します
	 *
	 * @return array レスポンス向けの配列データ
	 */
	public function toArrayResponse()
	{
		$data = [
			'id' => $this->id,
			'created_at' => $this->created_at,
			'screen_name' => $this->creator_id,
			'name' => $this->name
		];

		return $data;
	}
}
