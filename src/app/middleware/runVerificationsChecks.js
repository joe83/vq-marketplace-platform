const async = require("async");
const models = require("../models/models.js");

module.exports = (req, res, next) => {
    const userId = req.user.id;
    const userType = req.user.userType;

    models
        .appUserVerification
        .findAll({
            where: [
                { userType }
            ]
        })
        .then(verifications => {
            if (!verifications.length) {
                return next();
            }

            async
            .eachSeries(verifications, (verification, cb) => {
                const verificationObj = {};
                const verificationSteps = verification.steps.split(":");

                if (verification.type === "user") {
                    if (verificationSteps[0] === "equals") {
                        verificationObj[verification.fieldKey] = verificationSteps[1];
                    }

                    return req.models.user.findOne({
                        where: {
                            $and: [
                                { id: userId },
                                verificationObj
                            ]
                        }
                    })
                    .then(verificationPassed => {
                        if (verificationPassed) {
                            return cb();
                        }

                        return cb(verification);
                    });
                }

                if (verification.type === "userProperty") {
                    return req.models.userProperty
                        .findOne({
                            where: {
                                $and: [
                                    { id: userId }
                                ]
                            }
                        })
                        .then(userProperties => {
                            const property = userProperties
                            .find(_ => _.propKey === verification.fieldKey);

                            if (verificationSteps[0] === "required") {
                                if (property) {
                                    return cb();
                                }

                                return cb(verification);
                            }
                        });
                }

                return cb();
            }, failedVerification => {
                if (failedVerification) {
                    return res
                        .status(403)
                        .send(failedVerification);
                }

                return next();
            });
        });
};
