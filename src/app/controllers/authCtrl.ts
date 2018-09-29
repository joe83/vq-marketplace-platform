const async = require("async");
const vqAuth = require("../auth");
const userEmitter = require("../events/user");

import { VQ } from "../../core/interfaces";

const validateEmail = (email: string): boolean => { 
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
	return re.test(email);
};

interface AccountData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 0 | 1 | 2,
    props: {
        [propKey: string]: string;
    }
}

const createNewAccount = (models: any, data: AccountData, cb: VQ.StandardCallback) => {
    const email = data.email;
    const password = data.password;

    data.props = data.props || {};

    if (!validateEmail(email)) {
        return cb({
            httpCode: 400,
            code: "EMAIL_WRONGLY_FORMATTED",
            desc: "Email wrongly formatted"
        });
    }

    var vqUserId: number, vqAuthUser: object, user: object;
    var shouldBeAdmin = false;

    async
        .waterfall([
            (cb: VQ.StandardCallback) => {
                return vqAuth
                    .localSignup(models, email, password, (err: VQ.APIError, rUser: object) => {
                        if (err) {
                            return cb(err);
                        }

                        vqAuthUser = rUser;
                        vqUserId = rUser.userId;

                        return cb();
                    });
            },
            (cb: VQ.StandardCallback) => models.user
                .count({})
                .then((count: number) => {
                    shouldBeAdmin = !count;
                    
                    return cb();
                }, cb),
            (cb: VQ.StandardCallback) => {
                models
                .user
                .create({
                    accountType: "PRIVATE",
                    vqUserId,
                    status: shouldBeAdmin ? models.user.USER_STATUS.VERIFIED : models.user.USER_STATUS.UNVERIFIED,
                    isAdmin: shouldBeAdmin,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    userType: data.userType || 0
                })
                .then((rUser: any) => {
                    user = rUser;

                    if (shouldBeAdmin) {
                        console.log(`Admin user created for ${data.email}`);
                    }

                    return cb();
                }, cb);
            },
            (cb: VQ.StandardCallback) => async
                .eachSeries(
                Object.keys(data.props),
                (propKey: string, cb: VQ.StandardCallback) =>
                    models.userProperty
                    .create({
                        propKey,
                        propValue: data.props[propKey],
                        userId: user.id
                    })
                    .then(() => cb(), cb),
            cb),
            (cb: VQ.StandardCallback) => {
                models
                .user
                .findById(user.id, {
                    include: [{ all: true }]
                })
                .then((rUser: any) => {
                    user = rUser;

                    return cb();
                }, cb);
            }
        ], (err: VQ.APIError) => {
            if (err) {
                console.log("Error creating user");

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