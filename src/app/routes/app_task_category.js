const async = require("async");
const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;
const taskCtrl = require("../controllers/taskCtrl.js");

module.exports = app => {
    app.get("/api/app_task_categories", (req, res) =>
        req.models.appTaskCategory
        .findAll({
            order: [
                "label"
            ]
        })
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err))
    );

    app.post("/api/app_task_categories", isAdmin, (req, res) => {
        const category = {
            code: req.body.code,
            label: req.body.label,
            desc: req.body.desc || undefined,
            minPriceHour: req.body.minPriceHour || 0,
            bigImageUrl: req.body.bigImageUrl || undefined,
            imageUrl: req.body.imageUrl || undefined,
            unitOfMeasure: req.body.unitOfMeasure || undefined,
            minQuantity: req.body.minQuantity || undefined,
            maxQuantity: req.body.maxQuantity || undefined,
            quantityStep: req.body.quantityStep || undefined
        };
        
        req.models.appTaskCategory.create(category)
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err));
    });

    app.put("/api/app_task_categories/:id", isAdmin, (req, res) => {
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
            let appTaskCategory;
            const tasksOfCategory = [];
    
            async.waterfall([
                cb => {         
                    req.models.appTaskCategory
                    .findOne({
                        where: {
                            id
                        }
                    })
                    .then(rAppTaskCategory => {
                        appTaskCategory = rAppTaskCategory;
    
                        cb();
                    }, cb)
                },
                cb => {
                    taskCtrl.cancelAllUnbookedTasks(req.models, appTaskCategory.code, err => {
                        if (err) {
                            console.error(err);
                            cb(err);
                        }
    
                        console.log(`[SUCCESS] All tasks for category '${appTaskCategory.code}' have been cancelled along with their requests!`)
                        cb();
                    })
                },
                cb => {
                    req.models.appTaskCategory.update(category, {
                        where: { id }
                    })
                    .then(data => cb(null, data), cb)
                }
            ], (err, result) => {
                if (err) {
                    return res.status(400).send(err)
                }
    
                return res.status(200).send(result);        
            });   
        } else {
            req.models.appTaskCategory.update(category, {
                where: { id }
            })
            .then(data => res.status(200).send(data))
            .catch(err => res.status(400).send(err));
        }

 


    });

    app.delete("/api/app_task_categories/:id", isAdmin, (req, res) => {
        res.status(200).send({});

        req.models.appTaskCategory.destroy({ 
            where: {
                id: req.params.id
            }
        });
    });
};
