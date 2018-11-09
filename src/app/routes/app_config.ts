const responseController = require("../controllers/responseController.js");

const isAdmin = responseController.isAdmin;

import { Application, Request } from "express";

interface IConfig {
    fieldKey: string;
    fieldValue: string;
}

interface IVQRequest extends Request {
    models: any;
}

export default (app: Application) => {
    app.get("/api/app_config", (req, res) =>
        (req as IVQRequest).models
            .appConfig
            .findAll({
                order: [ "fieldKey" ]
            })
            .then((configs: IConfig[]) => {
                const resConfigs = JSON.parse(JSON.stringify(configs));

                // Never ever send it down.
                const STRIPE_PRIVATE_KEY = resConfigs.find(_ => _.fieldKey === "STRIPE_PRIVATE_KEY");

                if (STRIPE_PRIVATE_KEY) {
                    STRIPE_PRIVATE_KEY.fieldValue = "XXXXXXXXXXXXXXXXXXXXXXXX";
                }

                res.send(resConfigs);
            }, (err: any) => res.status(400).send(err))
    );

    app.post("/api/app_config", isAdmin, (req, res) => {
        const labels = req.body || [];

        (req as IVQRequest)
        .models
        .appConfig
        .bulkCreateOrUpdate(labels, true, (err: any) => {
            if (err) {
                return res.status(400).send(err);
            }

            res.send({
                ok: true
            });
        });
    });
};
