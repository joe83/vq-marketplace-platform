const async = require("async");
const randomToken = require("random-token");

const LoginCtrl = require("./controllers/LoginCtrl");

import { IVQModels } from "../interfaces";
import * as AuthCtrl from "./controllers/AuthCtrl";
import * as SignupCtrl from "./controllers/SignupCtrl";
import * as AuthService from "./services/AuthService";

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const localSignup = SignupCtrl.createLocalAccount;

export const requestPasswordReset = async (models: IVQModels, email: string) => {
    const userEmail = await models.userEmail.findOne({
        where: {
            $and: [
                { email }
            ]
        }
    });

    if (!userEmail) {
        await timeout(1000);

        return Promise.reject({ code: "EMAIL_NOT_FOUND" });
    }

    const resetCode = await models.userResetCode.create({
            code: randomToken(64),
            userId: userEmail.userId
    });

    return resetCode;
};

export const resetPassword = (models: IVQModels, resetCode: string, newPassword: String, cb) => {
    const code = resetCode;
    let userId: number;

    async.waterfall([
        cb => models
            .userResetCode
            .findOne({
                where: {
                    $and: [
                        { code }
                    ]
                }
            })
            .then((rUserResetCode: any) => {
                if (!rUserResetCode) {
                    return setTimeout(() =>
                        cb("WRONG_RESET_CODE"),
                        500
                    );
                }

                userId = rUserResetCode.userId;

                return cb();
            }, cb),
        cb => {
            return models.userResetCode
            .destroy({
                where: {
                    $and: [
                        { userId }
                    ]
                }
            })
            .then(_ => cb(), cb);
        },
        cb => {
            return models.userResetCode
            .destroy({
                where: {
                    $and: [
                        { userId }
                    ]
                }
            })
            .then(_ => cb(), cb);
        },
        cb => AuthService.createNewPassword(models, userId, newPassword, cb)
    ], err => {
        cb(err);
    });
};
interface IUserEmail {
    email: string;
}

export const getEmailsFromUserId = async (models: any, userId: number, cb: (err: any, emails?: string[]) => void) => {
    const userEmails: IUserEmail[] = await models.userEmail.findAll({
        where: {
            userId
        }
    });

    const emails = userEmails.map(_ => _.email);

    if (cb) {
        cb(undefined, emails);
    }

    return emails;
};

export const getAuthUserIdFromEmail = (models, email, cb) => {
    return AuthService
        .getUserIdFromEmail(models, email, (err, vqUser) => {
            return cb(err, vqUser);	
        });
};

export const localLogin = LoginCtrl.loginWithPassword;

export const checkToken = (models, authToken, cb) => {
    AuthCtrl.checkToken(models, authToken, (err, rAuthUser) => {
        return cb(err, rAuthUser);
    });
};

export const changePassword = (models, userId, currentPassword, newPassword, cb) => {
    AuthService
    .checkPassword(models, userId, currentPassword, (err, isCorrect) => {
        if (err) {
            return cb(err);
        }

        if (isCorrect) {
            AuthCtrl.changePassword(models, userId, newPassword);

            return cb();
        }

        return cb({
            status: 400,
            code: "WRONG_PASSWORD"
        });
    });
};
