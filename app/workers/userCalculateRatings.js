const async = require("async");
const models = require("../models/models.js");

const userCalculateRatings = () => {
    console.log('[WORKER] Calculating user avg. ratings');

    const userReviews = {};
    const settled = 0;

    async.waterfall([
        cb => {
            models.review
            .findAll({})
            .then(reviews => {
                reviews.forEach(review => {
                    userReviews[review.toUserId] = userReviews[review.userId] || [];

                    userReviews[review.toUserId]
                        .push(review);
                });

                return cb();
            }, cb);
        },
        cb => {
            async.eachSeries(Object.keys(userReviews), (userId, cb) => {
                const avgReviewRate = userReviews[userId]
                    .reduce((sum, review) => {
                        return sum += review.rate;
                    }, 0) / userReviews[userId].length;
                
                console.log(`User ${userId} rating: ${avgReviewRate}`);

                models.user
                    .update({
                        avgReviewRate 
                    }, {
                        where: {
                            id: userId
                        }
                    })
                    .then(_ => {
                        cb();
                    }, cb)
            }, cb)
        }
    ], err => {
        console.log(`[WORKER] Finished.`);

        if (err) {
            return console.error(err);
        }

        if (!module.parent) {
            return process.exit();
        }
    });
};

if (module.parent) {
    module.exports = userCalculateRatings;
}  else {
    userCalculateRatings();
}