'use strict';

module.exports = (request, response, next) => {
	try {
		const extensions = request.directoryRouter.findRoute(request.method.toLowerCase(), request.route.path).extensions;

		if ('headers' in extensions && extensions.headers.length !== 0) {
			for(const header of extensions.headers) {
				if (header == null) {
					response.status(500).send({error: {message: 'internal error', details: 'extentions.headers elements are missing'}});
					throw new Error('extentions.headers elements are missing');
				}

				if (request.get(header) == null) {
					response.status(400).send({error: {message: `${header} header is empty`}});
					return;
				}
			}
		}
	}
	catch(err) {
		console.log('checkHeaders failed');
		throw err;
	}

	next();
};
