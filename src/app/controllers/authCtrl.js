const async = require("async");
const vqAuth = require("../auth");
const userEmitter = require("../events/user");

const validateEmail = email => { 
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
	return re.test(email);
};

const createNewAccount = (models, data, cb) => {
    const email = data.email;
    const password = data.password;
    const userData = {};
    
    if (!validateEmail(email)) {
        return cb({
            httpCode: 400,
            code: "EMAIL_WRONGLY_FORMATTED",
            desc: "Email wrongly formatted"
        });
    }

    const propertiesToBeExcluded = [
        "email",
        "password",
        "repeatPassword"
    ];

    Object.keys(data)
        .filter(prop => propertiesToBeExcluded.indexOf(prop) === -1)
        .forEach(prop => {
            userData[prop] = data[prop];
        });
    
    var vqUserId, vqAuthUser, user;
    var shouldBeAdmin = false;

    async
        .waterfall([
            cb => {
                return vqAuth
                    .localSignup(models, email, password, (err, rUser) => {
                        if (err) {
                            return cb(err);
                        }

                        vqAuthUser = rUser;
                        vqUserId = rUser.userId;

                        return cb();
                    });
            },
            cb => models.user
            .count({})
            .then(count => {
                shouldBeAdmin = !count;
                
                return cb();
            }, cb),
            cb => {
                models
                .user
                .create({
                    accountType: "PRIVATE",
                    vqUserId,
                    status: shouldBeAdmin ? models.user.USER_STATUS.VERIFIED : models.user.USER_STATUS.UNVERIFIED,
                    isAdmin: shouldBeAdmin,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    userType: userData.userType || 0
                })
                .then(rUser => {
                    user = rUser;

                    console.log("Admin user created.");

                    return cb();
                }, cb);
            },
            cb => async
            .eachSeries(
            Object.keys(userData),
            (propKey, cb) =>
                models.userProperty
                .create({
                    propKey,
                    propValue: userData[propKey],
                    userId: user.id
                })
                .then(rUser => cb(), cb),
            cb)
        ], err => {
            if (err) {
                console.log("Error creating first user");

                return cb(err);
            }

            const responseData = vqAuthUser;

            responseData.user = user;

            if (!shouldBeAdmin) {
                const emittedUser = JSON.parse(JSON.stringify(user));
                
                emittedUser.emails = [
                    email
                ];

                userEmitter.emit("created", models, emittedUser);
            }

            return cb(err, vqAuthUser);
        });
};

module.exports = {
    createNewAccount
};