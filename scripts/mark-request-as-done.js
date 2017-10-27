const async = require("async");
const models = require("../app/models/models.js");
const requestCtrl = require("../app/controllers/requestCtrl");

const requestId = process.argv[2];
const userId = process.argv[3];

requestCtrl
    .changeRequestStatus(requestId, req.models.request.REQUEST_STATUS.MARKED_DONE, userId, (err) => {
        if (err) {
            console.error(err);

            return process.exit();
        }

        console.log(`Request ${requestId} marked as done`);

        return process.exit();
    });
    