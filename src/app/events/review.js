"use strict";

const EventEmitter = require("events");
const async = require("async");
const models = require("../models/models");
const emailService = require("../services/emailService.js");
const vqAuth = require("../auth");

class DefaultEmitter extends EventEmitter {}

const reviewEmitter = new DefaultEmitter();

const getReviewOwnerEmails = (models, reviewId, cb) => {
    let fromUserEmails, toUserEmails, review;

    return async.waterfall([
        cb => models
            .review
            .findOne({
                where: {
                    id: reviewId
                },
                include: [
                    { model: models.user, as: "fromUser" },
                    { model: models.user, as: "toUser" }
                ]
            })
            .then(rReview => {
                review = rReview;

                return cb();
            }, cb),
        cb => vqAuth
            .getEmailsFromUserId(models, review.fromUser.vqUserId, (err, _fromUserEmails) => {
                if (err) {
                    return cb(err);
                }

                fromUserEmails = _fromUserEmails;

                cb();
            }),
        cb => vqAuth
            .getEmailsFromUserId(models, review.toUser.vqUserId, (err, _toUserEmails) => {
                if (err) {
                    return cb(err);
                }

                toUserEmails = _toUserEmails;

                cb();
            })
        ], err => {
            cb(err, {
                review,
                toUserEmails,
                fromUserEmails
            });
        });
};

const reviewEventHandlerFactory = (emailCode, actionUrlFn) => {
	return (models, reviewId) => {
		var review;
		var fromUserEmails, toUserEmails;
		var ACTION_URL;

		async.waterfall([
			cb => getReviewOwnerEmails(models, reviewId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                fromUserEmails = data.fromUserEmails;
                toUserEmails = data.toUserEmails;
                review = data.review;

				return cb();
            }),
            cb => {
                cb();

                models.review
                .findAll({ 
                    where: {
                        toUserId: review.toUserId
                    }
                })
                .then((userReviews) => {
                    const reviewsNo = userReviews.length;
                    const avgReviewRate = userReviews
                        .reduce((sum, review) => {
                            return sum += Number(review.rate);
                        }, 0) / reviewsNo;
                    
                    models.user
                    .update({
                        avgReviewRate 
                    }, {
                        where: {
                            id: review.toUserId
                        }
                    })
                    .then(() => {}, err => console.error(err));
                }, err => console.error(err));
            },
			cb => models
				.appConfig
				.findOne({
					where: {
						fieldKey: "DOMAIN"
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || "http://localhost:3000";

					ACTION_URL = 
						actionUrlFn(domain, review.toUser.id);

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
            }
            
            emailService
            .checkIfShouldSendEmail(models, emailCode, review.toUser.id, () =>
                emailService
                .getEmailAndSend(models, emailCode, toUserEmails, {
                    ACTION_URL
                })
            );
		});
	};
};

reviewEmitter
	.on("review-left", 
		reviewEventHandlerFactory("review-left", (domain, userId) => `${domain}/app/profile/${userId}`)
	);

module.exports = reviewEmitter;
