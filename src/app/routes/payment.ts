/// <reference types="express-serve-static-core" />
/// <reference types="serve-static" />

const stripe = require("stripe")("sk_test_YBNHjAXJ2I1fKOrQaLTdP0e4");
const responseController = require("../controllers/responseController.js");
const isLoggedIn = responseController.isLoggedIn;
const isAdmin = responseController.isAdmin;

const tenantDb = require("../../app-tenant/models");

const createAccount = (type: string, country: string, email: string, cb: (err: any, account?: any) => void) => {
    stripe.accounts.create({
        type,
        country,
        email,
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
    app.get("/api/user/payment/account/:networkId", isLoggedIn, (req: Express.Request, res: Express.Response) => {
        const whereAndObj = [];

        whereAndObj.push({ userId: (req as any).user.id });

        if (((req as any).params as any).networkId) {
            whereAndObj.push({ userId: (req as any).params.networkId });
        }
        
        (req as any).models
        .userPaymentAccount
        .findOne({
            where: {
                $and: whereAndObj
            }
        })
        .then((paymentAccount: any) => {
            if (!paymentAccount) {
                return (res as any).status(404).send({
                    code: "NOT_FOUND"
                });
            }

            // we map it and drop many attributes for security reasons!
            const accounts = {
                id: paymentAccount.id,
                networkId: paymentAccount.networkId,
                accountId: paymentAccount.accountId,
            };
            return (res as any).send(accounts);
        }, (err: any) => (res as any).status(400).send(err));
    });

    app.post("/api/user/payment/account/:networkId", isLoggedIn, (req: any, res: any) => {
        const models = req.models;

        models
        .userAuth
        .findOne({
            where: {
                id: req.user.vqUserId
            },
            include: [
                { model: models.userEmail }
            ]
        })
        .then((vqUser: any) => {
            createAccount("standard", req.user.country, vqUser.userEmails[0].address, (err, rAccount) => {
                if (err) {
                    if (err.type === "StripeInvalidRequestError") {
                        return res.status(400).send({
                            code: "STRIPE_ERROR",
                            desc: err.message
                        });
                    }

                    return res.status(400).send({
                        code: "STRIPE_ERROR",
                        desc: err.message
                    });
                }

                models
                .userPaymentAccount
                .create({
                   networkId: "stripe",
                   accountId: rAccount.id,
                   publicKey: rAccount.keys.publishable,
                   secretKey: rAccount.keys.secret,
                   data: rAccount // json object
                }).then((createdAccount: any) => {
                    return res.send({
                        id: createdAccount.id,
                        networkId: createdAccount.networkId,
                        accountId: createdAccount.accountId
                    });
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
    app.get("/api/payment/account", isLoggedIn, isAdmin, (req: any, res: any) => {
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
            return res.send(rTenant);
        }, (err: any) => res.status(400).send(err));
    });

    /**
     * Creates an account for the marketplace
     * Stripe is the only one supported payment provider at a time
     */
    app.post("/api/payment/account", isLoggedIn, isAdmin, (req: any, res: any) => {
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
                    if (err.type === "StripeInvalidRequestError") {
                        return res.status(400).send({
                            code: "STRIPE_ERROR",
                            desc: err.message
                        });
                    }

                    return res.status(400).send({
                        code: "STRIPE_ERROR",
                        desc: err.message
                    });
                }

                rTenant
                .update({
                    stripeAccount: rAccount
                })
                .then(() => {
                    return res.send(rAccount);
                }, (err: any) => res.status(400).send(err));
            });
        });
    });
};
