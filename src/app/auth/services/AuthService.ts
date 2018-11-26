const bcrypt = require("bcrypt-nodejs");
const async = require("async");
const randomToken = require("random-token");
const logIndex = "[AuthService]";

export const generateHashSync = (password: string) => bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

export const validPasswordSync = (password, encryptedPassword) => {
	if (!password || !encryptedPassword) {
		console.error(logIndex, "validPasswordSync", "initial arguments");

		return false;
	}

	return bcrypt.compareSync(password, encryptedPassword);
};

export const createNewUser = (models, callback) => {
	return models.userAuth
		.create({})
		.then(instance => callback(null, instance), err => callback(err));
};

export const createNewPassword = (models, userId, password, cb) => {
	cb = cb || function() {};

	if (!userId || !password) {
		return cb("INIT_PARAMS");
	}

	models.userPassword
	.destroy({
		where: {
			$and: [
				{ userId }
			]
		},
		password: generateHashSync(password)
	})
	.then(() => {
		models
		.userPassword
		.create({
			userId: userId, 
			password: generateHashSync(password)
		})
		.then(() => cb(), cb);
	}, cb);
};

export const createNewEmail = (models, userId, email, callback) => async.series([
	cb => models.userEmail
		.findOne({
			where: {
				$and: [ 
					{ email }
				]
			}
		})
		.then(result => {
			if (result) {
				return cb({
					code: "EMAIL_EXISTS"
				});
			}

			return cb();
		}, cb),
	cb => {
		models.userEmail
		.create({
			userId: userId, 
			email: email
		})
		.then(() => cb(), cb);
	}
], err => callback(err));

export const createNewToken = (models, userId, cb) => {
	console.log(`[${models.tenantId}]: Creating new user token for vqUserId ${userId}`);

	models
	.userToken
	.create({
		token: randomToken(250),
		userId: userId
	})
	.then(instance => {
		console.log("Token successfuly created.");

		return cb(null, instance.dataValues);
	}, cb);
};

export const checkToken = (models, token, callback) => {
	models.userToken
		.findOne({
			where: [
				{ token }
			]
		})
		.then(instance => {
			var response = instance || false;

			return callback(null, response);
		}, err => callback(err));
};

export const checkPassword = (models, userId, password, callback) => {
	models.userPassword
		.findOne({
			where: {
				$and: [
					{ userId }
				]
			}
		})
		.then(instance => {
			var isCorrect = false;

			if (instance) {
				isCorrect = validPasswordSync(password, instance.password);
			}

			return callback(null, isCorrect);
		}, err => callback(err));
};

export const getEmailsFromUserId = (models: any, vqUserId: number, callback) => {
	return models.userEmail.findAll({
			where: {
				userId: vqUserId
			}
		}).then(instances => {
			callback(null, instances || false)
		}, err => callback(err));
};

export const getUserIdFromEmail = (models, email, callback) => {
	return models.userEmail
		.findOne({
			where: {
				$and: [
					{ email }
				]
			}
		})
		.then(
			instance => callback(null, instance || false),
			err => callback(err)
		);
};

export const addUserProp = (models, userId, propKey, propValue, callback) => {
	if (!userId || !propKey) {
		return callback({
			status: 400,
			code: "INITIAL_PARAMS",
			message: `userId: ${userId}, propKey: ${propKey}`
		});
	}

	models.userProp
	.findOne({
		where: {
			$and: [
				{ userId },
				{ propKey }
			]
		}
	})
	.then((err, result) => {
		if (err) {
			console.error(err);

			return callback(err);
		}

		var promise;

		if (result) {
			promise = models.userProp.update({ 
				propValue 
			}, { 
				where: [
					{ propKey },
					{ userId }
				]
			});
		} else {
			promise = models.userProp.create({ 
				propValue,
				propKey,
				userId
			}, { 
				where: [
					{ propKey },
					{ userId }
				]
			});
		}

		promise
		.then(() => callback(), callback);
	});
};
