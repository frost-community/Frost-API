class EventIdHelper {
	/**
	 * @param {string} eventType
	 * @param {string[]} params
	*/
	static buildEventId(params) {
		return params.join('.');
	}
	/** @param {string} eventId */
	static parseEventId(eventId) {
		return eventId.split('.');
	}
	/**
	 * @param {string} eventId
	 * @param {string[]} partialParams
	*/
	static contain(eventId, partialParams) {
		const params = EventIdUtil.parseEventId(eventId);
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
module.exports = EventIdHelper;
