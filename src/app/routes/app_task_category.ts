
const responseController = require("../controllers/responseController");
const taskCtrl = require("../controllers/taskCtrl");

const isAdmin = responseController.isAdmin;

import * as async from "async";
import { Application } from "express";
import { IVQRequest } from "../interfaces";

export default (app: Application) => {
    app.get("/api/app_task_categories", (req: IVQRequest, res) =>
        req.models.appTaskCategory
        .findAll({
            order: [
                "label"
            ]
        })
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err))
    );

    app.post("/api/app_task_categories", isAdmin, (req: IVQRequest, res) => {
        const category = {
            bigImageUrl: req.body.bigImageUrl || undefined,
            code: req.body.code,
            desc: req.body.desc || undefined,
            imageUrl: req.body.imageUrl || undefined,
            label: req.body.label,
            maxQuantity: req.body.maxQuantity || undefined,
            minPriceHour: req.body.minPriceHour || 0,
            minQuantity: req.body.minQuantity || undefined,
            quantityStep: req.body.quantityStep || undefined,
            unitOfMeasure: req.body.unitOfMeasure || undefined
        };

        req.models.appTaskCategory.create(category)
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err));
    });

    app.put("/api/app_task_categories/:id", isAdmin, (req: IVQRequest, res) => {
        const id = req.params.id;
        const category = {
            code: req.body.code,
            status: req.body.status,
            label: req.body.label,
            desc: req.body.desc,
            minPriceHour: req.body.minPriceHour,
            bigImageUrl: req.body.bigImageUrl,
            imageUrl: req.body.imageUrl
        };

        if (category.status && category.status === req.models.appTaskCategory.TASK_CATEGORY_STATUS.INACTIVE) {
            let appTaskCategory: { code: string };

            return async.waterfall([
                async (cb) => {
                    try {
                        appTaskCategory = await req.models.appTaskCategory
                        .findOne({
                            where: {
                                id
                            }
                        });
                    } catch (err) {
                       return cb(err);
                    }

                    return cb();
                },
                cb => {
                    taskCtrl.cancelAllUnbookedTasks(req.models, appTaskCategory.code, err => {
                        if (err) {
                            console.error(err);

                            return cb(err);
                        }

                        console.log(`[SUCCESS] All tasksfor category '${appTaskCategory.code}' have been cancelled!`);

                        cb();
                    });
                },
                cb => {
                    req.models.appTaskCategory.update(category, {
                        where: { id }
                    })
                    .then(data => cb(undefined, data), cb)
                }
            ], (err, result) => {
                if (err) {
                    return res.status(400).send(err);
                }
    
                return res.status(200).send(result);
            });
        }

        return req.models.appTaskCategory.update(category, {
            where: { id }
        })
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err));

    });

    app.delete("/api/app_task_categories/:id", isAdmin, async (req: IVQRequest, res) => {
        await req.models.appTaskCategory.destroy({
            where: {
                id: req.params.id
            }
        });

        res.status(200).send({});
    });
};
