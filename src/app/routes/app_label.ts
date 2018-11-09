import { Application } from "express";
import { IVQRequest } from "../interfaces";

const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;

export default (app: Application) => {
    app.get("/api/app_label", (req: IVQRequest, res) => {
        const lang = req.query.lang;

        if (lang) {
            return req.models.appLabel
                .findAll({
                    order: [ "labelKey" ],
                    where: {
                        lang
                    }
                })
                .then(labels => res.send(labels), err => res.status(400).send(err));
        }

        res.status(400).send("Specify language");
    });

    app.post("/api/app_label", isAdmin, (req: IVQRequest, res) => {
        const labels = req.body || [];

        const forceUpdate = true;

        req.models
        .appLabel
        .bulkCreateOrUpdate(labels, forceUpdate, err => {
            if (err) {
                return res.status(400).send(err);
            }

            res.send({
                ok: true
            });
        });
    });
};
