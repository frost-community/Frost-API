<?php

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
	public static function create($screenName, $password, $name, $container)
	{
		$timestamp = time();

		$user = Model::factory('UserModel')->create();

		$isOccurredError = false;
		$errorTargets = [];

		if (!\Utility\Regex::isMatch('/^[a-z0-9_]{4,15}$/i', $screenName) || \Utility\Regex::isMatch('/^(.)\1{3,}$/', $screenName))
		{
			$isOccurredError = true;
			$errorTargets[] = 'screen-name';
		}
		else
		{
			if ($Model::factory('UserModel')->where_equal('screen_name', $screenName)->find_one())
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

	/**
	 * アプリケーションを取得します
	 */
	public function applications()
	{
		return $this->belongs_to('ApplicationModel', 'id');
	}

	/**
	 * アプリケーションアクセスを取得します
	 */
	public function applicationAccesses()
	{
		return $this->belongs_to('ApplicationAccessModel', 'id');
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
