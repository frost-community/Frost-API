/**
 * 保存されているデータフォーマットを確認します。
 *
 * APIのバージョンアップによって保存されるデータの構造が変更される場合があります。
 * 「データフォーマット」は、正常に初期化・データ移行するために必要な識別子です。
 *
 * 0: 準備完了
 * 1: 初期化が必要
 * 2: 移行が必要
 * 3: 不明なバージョン
 * @return {Promise<0 | 1 | 2 | 3>}
*/
module.exports = async (repository, currentVersion) => {
	const dataFormat = await repository.find('meta', { type: 'dataFormat' });

	let docCount = 0;
	docCount += await repository.count('users', {});
	docCount += await repository.count('applications', {});
	docCount += await repository.count('tokens', {});

	// データフォーマットが保存されていないとき
	if (dataFormat == null) {
		if (docCount == 0) {
			return 1; // 初期化が必要
		}
		else {
			return 2; // 移行が必要
		}
	}

	// データフォーマットが一致しているとき
	if (dataFormat.value === currentVersion) {
		return 0; // 準備完了
	}

	// データフォーマットが期待したものであるとき
	if (dataFormat.value < currentVersion) {
		return 2; // 移行が必要
	}
	else {
		return 3; // 不明なバージョン
	}
};
