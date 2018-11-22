import * as async from "async";
import * as randomstring from "randomstring";
import * as vqAuth from "../auth";
import * as userEmitter from "../events/user";
import { VQ } from "../../core/interfaces";

const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
	return re.test(email);
};

const checkUserName = (username: string): boolean => {
    const pattern = new RegExp(/[~`!#@$%\^&*+=. \-\[\]\\';,/{}|\\":<>\?]/);

    if (pattern.test(username)) {
        return false;
    }

    return true;
};

const checkPassword = (password: string): boolean => {
    if (password.length < 8) {
        return false;
    }

    return true; //good user input
};

export const createNewAccount = async (models: any, data: VQ.AccountData, cb: VQ.StandardCallback) => {
    const email = data.email;
    // if no password is generated, we generate a random one. User will have to restart it in order to log-in.
    const password = data.password || randomstring.generate(10);

    if (!validateEmail(email)) {
        return cb({
            code: "EMAIL_WRONGLY_FORMATTED",
            desc: "Email wrongly formatted",
            httpCode: 400
        });
    }

    if (!checkPassword(password)) {
        return cb({
            code: "USER_WRONG_FORMAT",
            desc: "User has unallowed format.",
            httpCode: 400
        });
    }

    if (!checkUserName(data.username)) {
        return cb({
            code: "USER_WRONG_FORMAT",
            desc: "User has unallowed format.",
            httpCode: 400
        });
    }

    const userWithUsername = await models.user.findOne({
        where: {
            username: data.username
        }
    });

    if (userWithUsername) {
        return cb({
            code: "USERNAME_EXISTS",
            desc: "Username already exists.",
            httpCode: 400
        });
    }

    data.props = (data.props || {});

    let vqUserId: number;
    let vqAuthUser: object;
    let user: object;
    let shouldBeAdmin = false;

    const username = data.username || `${data.firstName}${data.lastName}`;

    async.waterfall([
        (cb: VQ.StandardCallback) => {
            return vqAuth.localSignup(models, email, password, (err: VQ.APIError, rUser: object) => {
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
        async (cb: VQ.StandardCallback) => {
            const userData = {
                accountType: "PRIVATE",
                firstName: data.firstName,
                isAdmin: shouldBeAdmin,
                lastName: data.lastName,
                status: shouldBeAdmin ? models.user.USER_STATUS.VERIFIED : models.user.USER_STATUS.UNVERIFIED,
                userType: data.userType || 0,
                username,
                vqUserId
            };

            try {
                user = await models.user.create(userData);
            } catch (err) {
                return cb(err);
            }

            if (shouldBeAdmin) {
                console.log(`Admin user created for ${data.email}`);
            }

            return cb();
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
