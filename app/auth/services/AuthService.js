const bcrypt = require('bcrypt-nodejs');
const async = require("async");
const randtoken = require('rand-token');
const logIndex = "[AuthService]";

const generateHashSync = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

const validPasswordSync = (password, encryptedPassword) => {
	if (!password || !encryptedPassword) {
		console.error(logIndex, "validPasswordSync", "initial arguments");

		return false;
	}

	return bcrypt.compareSync(password, encryptedPassword);
}

const createNewUser = (models, callback) => {
	return models.userAuth
		.create({})
		.then(instance => callback(null, instance), err => callback(err));
};

const createNewPassword = (models, userId, password, cb) => {
	cb = cb || function() {};

	if (!userId || !password) {
		return cb('INIT_PARAMS');
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
	.then(_ => {
		return models.userPassword.create({
			userId: userId, 
			password: generateHashSync(password)
		})
	})
	.then(_ => cb())
	.catch(cb);
};

const createNewEmail = (models, userId, email, callback) => async.series([
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
		.then(instance => cb(), cb);
	}
], err => callback(err));



const getUserIdFromNetwork = (network, networkId, callback) => {
	var sql = "SELECT user.id AS userId FROM user AS user";

	sql += " INNER JOIN userNetwork AS network";
	sql += " ON network.userId = user.id"
	sql += ` WHERE network.networkId = ${networkId} AND network.network = '${network}'`;

	models.seq.query(sql)
	.then(result => {
		if (err) {
			return callback(err);
		}

		if (result.length) {
			return callback(null, result[0])
		}

		return callback(null, false);
	});
};

const updateNetworkToken = (userId, network, networkId, token) =>
	models.userToken
		.update({
			token: token
		}, {
			where: {
				$and: [ 
					 { networkId },
					 { userId },
				]
			}
		})
		.then(() => {}, err => console.error(err));

const createNewNetwork = (models, userId, network, networkId, token, refreshToken, callback) =>
	models.userNetwork
		.create({
			userId: userId,
			network: network,
			networkId: networkId,
			token: token,
			refreshToken: refreshToken
		})
		.then(instance => callback(), err => callback(err));

const createNewToken = (models, userId, callback) =>
	models.userToken
		.create({
			token: randtoken.generate(250),
			userId: userId,
		}, {
			raw: true
		})
		.then(instance => callback(null, instance.dataValues), err => callback(err));

const checkToken = (models, token, callback) => {
	models.userToken
		.findOne({
			where: [
				{ token }
			]
		})
		.then(instance => {
			var response = instance || false;

			return callback(null, response);
		}, err => callback(err))
};

const checkPassword = (models, userId, password, callback) => {
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
		}, err => callback(err))
};

const getEmailsFromUserId = (models, userId, callback) => {
	return models.userEmail
		.findAll({
			where: {
				$and: [
					{ userId }
				]	
			}
		})
		.then(instances =>
			callback(null, instances || false),
			err => callback(err)
		)
};

const getUserIdFromEmail = (models, email, callback) => {
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
		)
};

const addUserProp = (userId, propKey, propValue, callback) => {
	if (!userId || !propKey) {
		return callback({
			status: 400,
			code: "INITIAL_PARAMS"
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

module.exports = {
	createNewUser,
	createNewPassword,
	createNewEmail,
	createNewToken,
	createNewNetwork,
	addUserProp,
	checkPassword,
	checkToken,
	getUserIdFromEmail,
	getEmailsFromUserId,
	getUserIdFromNetwork,
	updateNetworkToken,
	generateHashSync,
	validPasswordSync
};