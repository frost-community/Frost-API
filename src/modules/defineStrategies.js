const passport = require('passport');
const { Strategy : BearerStrategy } = require('passport-http-bearer');

module.exports = (repository) => {
	passport.use('accessToken', new BearerStrategy(async (accessToken, done) => {
		try {
			const token = await repository.find('tokens', { accessToken });
			if (token == null) {
				done(null, false);
				return;
			}
			const user = await repository.find('users', { _id: token.userId });
			if (user == null) {
				done(null, false);
				return;
			}
			done(null, user);
		}
		catch (err) {
			done(err);
		}
	}));
};
