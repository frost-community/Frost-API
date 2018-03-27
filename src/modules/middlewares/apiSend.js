module.exports = (req, res, next) => {
	res.apiSend = (apiContext) => {
		let sendData = {};

		if (!apiContext.responsed) {
			throw new Error('api has not responsed yet');
		}

		if (apiContext.statusCode == null) {
			apiContext.statusCode = 200;
		}

		if (typeof apiContext.data == 'string') {
			sendData.message = apiContext.data;
		}
		else if (apiContext.data != null) {
			sendData = apiContext.data;
		}

		if (Object.keys(sendData).length == 0) {
			sendData = null;
		}

		res.status(apiContext.statusCode).send(sendData);
	};
	next();
};
