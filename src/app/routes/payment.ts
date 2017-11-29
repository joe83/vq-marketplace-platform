/// <reference types="express-serve-static-core" />
/// <reference types="serve-static" />
import * as async from "async";

const stripe = require("../../shared-providers/stripe");
const responseController = require("../controllers/responseController.js");
const isLoggedIn = responseController.isLoggedIn;
const isAdmin = responseController.isAdmin;
const tenantDb = require("../../app-tenant/models");

import { VQExpressRequest } from "../../core/interfaces";

interface ResAccount {
    // id is present only if it is an user account!
    id?: number,
    networkId: string,
    accountId: string
}

const STRIPE_OAUTH_URL = "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_BkVVRC7fm3enzQf5vokZONlatEfC6tiF&scope=read_write&state=*";

const createAccount = (type: string, country: string, email: string, cb: (err: any, account?: any) => void) => {
    stripe
    .accounts
    .create({
        type,
        country,
        email
   })
   .then((rAccount: any) => {
       console.log(rAccount);

       cb(null, rAccount);
   }, (err: any) => {
       console.log(err);

       cb(err);
   });
};

module.exports = (app: any) => {
    app.get(
        "/api/payment-object/:provider/:objType/:objId",
        isLoggedIn,
        (req: VQExpressRequest, res: Express.Response) => {
            /**
             * Here we pass the call to the payment gateway to retrive details
             */

            switch (req.params.provider) {
                case "stripe":
                    // @todo
                    break;

                case "barion":
                    // @todo
                    break;

                default:
                // @todo
            }


            (res as any).send("NOT IMPLEMENTED YET");
        });

    app.get(
        "/api/payment-object/:paymentProvider/:objType",
        isLoggedIn,
        (req: VQExpressRequest, res: Express.Response) => {
            req
            .models
            .paymentObject
            .findAll({
                where: {
                    $and: [
                        { userId: req.user.id },
                        { provider: req.params.paymentProvider },
                        { type: req.params.objType }
                    ]
                }
            })
            .then(
                (data: any) => (res as any).send(data),
                (err: any) => (res as any).status(400).send(err)
            );
        });

    app.post(
        "/api/payment-object/:provider/:type",
        isLoggedIn,
        (req: VQExpressRequest, res: Express.Response) => {
            async.waterfall([
                (cb: any) => {
                    if (req.params.type !== "card") {
                        return cb();
                    }

                    // for security reasons we destroy all previous card tokens, so they cannot be used anymore
                    req
                    .models
                    .paymentObject
                    .destroy({
                        where: {
                            $and: [
                                { type: "card" },
                                { userId: req.user.id }
                            ]
                        }
                    })
                    .then(() => {
                        cb();
                    }, cb);
                },
                (cb: any) => {
                    req
                    .models
                    .paymentObject
                    .create({
                        orderId: req.body.orderId,
                        userId: req.user.id,
                        provider: req.params.provider,
                        type: req.params.type,
                        objId: req.body.objId,
                        obj: req.body.obj
                    })
                    .then((data: any) => cb(undefined, data), cb);
                }
            ], (err: any, data: any) => {
                if (err) {
                    (res as any).status(400).send(err);
                    
                    return;
                }

                (res as any).send(data);
            });
        });

    app.get(
        "/api/user/payment/account/:networkId",
        isLoggedIn,
        (req: Express.Request, res: Express.Response) => {
            const whereAndObj = [];

            whereAndObj.push({
                userId: (req as any).user.id
            });

            if (((req as any).params as any).networkId) {
                whereAndObj.push({ networkId: (req as any).params.networkId });
            }
            
            (req as any)
            .models
            .userPaymentAccount
            .findOne({
                where: {
                    $and: whereAndObj
                }
            })
            .then((paymentAccount: any) => {
                if (!paymentAccount) {
                    return (res as any)
                        .status(400)
                        .send({
                            code: "STRIPE_NOT_CONNECTED"
                        });
                }

                // we map it and drop many attributes for security reasons!
                const account: ResAccount = {
                    id: paymentAccount.id,
                    networkId: paymentAccount.networkId,
                    accountId: paymentAccount.accountId,
                };

                return (res as any).send(account);
            }, (err: any) => (res as any).status(400).send(err));
    });

    app.post("/api/user/payment/account/:networkId", isLoggedIn, (req: any, res: any) => {
        const models = req.models;

        models
        .user
        .findOne({
            where: {
                id: req.user.id
            },
            include: [
                {
                    model: models.billingAddress
                }, {
                    as: "vqUser",
                    model: models.userAuth,
                    include: [
                        { model: models.userEmail }
                    ]
                }
            ]
        })
        .then((rUser: any) => {
            if (!rUser.billingAddresses.length) {
                return res.status(400).send({
                    code: "MISSING_BILLING_INFORMATION"
                });
            }

            createAccount("standard", rUser.billingAddresses[0].countryCode, rUser.vqUser.userEmails[0].email, (err, rAccount) => {
                if (err) {
                    console.log(err);

                    const resError = {
                        code: "STRIPE_ERROR",
                        desc: err.message,
                        redirectUrl: STRIPE_OAUTH_URL
                            .replace("*", `${models.tenantId}`)
                    };

                    if (err.type === "StripeInvalidRequestError") {
                        return res.status(400).send(resError);
                    }
                    
                    return res.status(400).send(resError);
                }

                models
                .userPaymentAccount
                .create({
                   userId: req.user.id,
                   networkId: "stripe",
                   accountId: rAccount.id,
                   publicKey: rAccount.keys.publishable,
                   secretKey: rAccount.keys.secret,
                   data: rAccount // json object
                })
                .then((createdAccount: any) => {
                    const resAccount: ResAccount = {
                        id: createdAccount.id,
                        networkId: createdAccount.networkId,
                        accountId: createdAccount.accountId
                    };

                    return res.send(resAccount);
                }, (err: any) => res.status(400).send(err));
            });
        }, (err: any) => {
            console.error(err);

            res.status(400).send(err);
        });
    });

     /**
     * Creates an account for the marketplace
     * Stripe is the only one supported payment provider at a time
     */
    app.get("/api/payment/account/:networkId", isLoggedIn, isAdmin, (req: any, res: any) => {
        const tenantModels = tenantDb.get("vq-marketplace");
        const models = req.models;

        tenantModels
        .tenant
        .findOne({
            where: {
                tenantId: models.tenantId
            }
        })
        .then((rTenant: any) => {
            if (!rTenant.stripeAccountId) {
                return res.status(400).send({
                    code: "STRIPE_NOT_CONNECTED"
                });
            }

            const resAccount: ResAccount = {
                networkId: "stripe",
                accountId: rTenant.stripeAccountId
            };

            return res.send(resAccount);
        }, (err: any) => {
            res.status(400).send(err)
        });
    });

    /**
     * Creates an account for the marketplace
     * Stripe is the only one supported payment provider at a time
     */
    app.post("/api/payment/account/:networkId", isLoggedIn, isAdmin, (req: any, res: any) => {
        const tenantModels = tenantDb.get("vq-marketplace");
        const models = req.models;

        tenantModels
        .tenant
        .findOne({
            where: {
                tenantId: models.tenantId
            }
        })
        .then((rTenant: any) => {
            createAccount("standard", rTenant.country, rTenant.email, (err, rAccount) => {
                if (err) {
                    console.log(err);

                    const resError = {
                        code: "STRIPE_ERROR",
                        desc: err.message,
                        redirectUrl: STRIPE_OAUTH_URL.replace("*", models.tenantId)
                    };

                    if (err.type === "StripeInvalidRequestError") {
                        return res.status(400).send(resError);
                    }
                    
                    return res.status(400).send(resError);
                }

                rTenant
                .update({
                    stripeAccount: rAccount
                })
                .then(() => {
                    const resAccount: ResAccount = {
                        networkId: "stripe",
                        accountId: rAccount.id
                    };

                    return res.send(resAccount);
                }, (err: any) => res.status(400).send(err));
            });
        });
    });
};