"use strict";

const EventEmitter = require('events');
const async = require('async');
const models = require("../models/models");
const EmailService = require("../services/emailService.js");
const config = require("../config/configProvider.js")();
const vqAuth = require("../config/vqAuthProvider");

class DefaultEmitter extends EventEmitter {}

const reviewEmitter = new DefaultEmitter();

const getReviewOwnerEmails = (reviewId, cb) => {
    let fromUserEmails, toUserEmails, review;

    return async.waterfall([
        cb => models
            .review
            .findOne({
                where: {
                    id: reviewId
                },
                include: [
                    { model: models.user, as: 'fromUser' },
                    { model: models.user, as: 'toUser' }
                ]
            })
            .then(rReview => {
                review = rReview;

                return cb();
            }, cb),
        cb => vqAuth
            .getEmailsFromUserId(review.fromUser.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                fromUserEmails = rUserEmails
                    .map(_ => _.email);

                cb();
            }),
        cb => vqAuth
            .getEmailsFromUserId(review.toUser.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                toUserEmails = rUserEmails
                    .map(_ => _.email);

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
	return reviewId => {
		var review;
		var fromUserEmails, toUserEmails;
		var ACTION_URL;

		async.waterfall([
			cb => getReviewOwnerEmails(reviewId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                fromUserEmails = data.fromUserEmails;
                toUserEmails = data.toUserEmails;
                review = data.review;

				return cb();
            }),
			cb => models
				.appConfig
				.findOne({
					where: {
						fieldKey: 'DOMAIN'
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || 'http://localhost:3000';

					ACTION_URL = 
						actionUrlFn(domain, review.toUser.id);

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}

			if (toUserEmails) {
				EmailService
					.getEmailAndSend(emailCode, toUserEmails[0], ACTION_URL);
			}
		});
	};
};

reviewEmitter
	.on('review-left', 
		reviewEventHandlerFactory('review-left', (domain, userId) => `${domain}/app/profile/${userId}`)
	);

if (module.parent) {
	module.exports = reviewEmitter;
} else {
	console.log(process.argv[2])
	console.log(process.argv[3])
	
	reviewEmitter.emit(process.argv[2], process.argv[3]);
}