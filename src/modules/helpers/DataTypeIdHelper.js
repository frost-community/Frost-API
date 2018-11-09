class DataTypeIdHelper {
	/**
	 * @param {string[]} params
	*/
	static build(params) {
		return params.join('.');
	}
	/** @param {string} dataTypeId */
	static parse(dataTypeId) {
		return dataTypeId.split('.');
	}
	/**
	 * @param {string} dataTypeId
	 * @param {string[]} partialParams
	*/
	static contain(dataTypeId, partialParams) {
		const params = DataTypeIdHelper.parse(dataTypeId);
		if (partialParams > params) {
			return false;
		}
		for (let i = 0; i < partialParams.length; i++) {
			if (partialParams[i] != params[i]) {
				return false;
			}
		}
		return true;
	}
}
module.exports = DataTypeIdHelper;
