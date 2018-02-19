const async = require("async");
const request = require("request-json");
const fs = require("fs");

const standardTemplates = {
    "bitcoinmeetup": "bitcoinmeetup",
    "rentals": "rentkitchen",
    "products": "b2btemplate",
    "services": "taskrabbit"
};

async.each(Object.keys(standardTemplates), (marketplaceType, cb) => {
    const tenantId = standardTemplates[marketplaceType];
    const client = request.createClient(`https://${tenantId}.vqmarketplace.com`);

    console.log(`Getting ${marketplaceType} marketplace: ${tenantId}`);
    
    async.waterfall([
        cb => {
            client.get("/api/app_config", (err, res, body) => {
                const obj = {};
        
                body.forEach(configRow => {
                    obj[configRow.fieldKey] = configRow.fieldValue;
                });
        
                fs.writeFileSync(__dirname + `/../src/example-configs/${marketplaceType}/config.json`, JSON.stringify(obj, undefined, 2), "utf8");
        
                cb();
            });
        },
        cb => {
            client.get("/api/app_label?lang=en", (err, res, body) => {
                const obj = {};
        
                body.forEach(configRow => {
                    obj[configRow.labelKey] = configRow.labelValue;
                });
        
                fs.writeFileSync(
                    __dirname + `/../src/example-configs/${marketplaceType}/i18n/en.json`,
                    JSON.stringify(obj, undefined, 2),
                    "utf8"
                );
        
                cb();
            });
        },
        cb => {
            client.get("/api/post", (err, res, body) => {
                const obj = body.map(row => {
                    delete row.id;

                    return row;
                });
        
                fs.writeFileSync(
                    __dirname + `/../src/example-configs/${marketplaceType}/posts.json`,
                    JSON.stringify(obj, undefined, 2),
                    "utf8"
                );
        
                cb();
            });
        },
        cb => {
            client.get("/api/app_task_categories", (err, res, body) => {
                const obj = body.map(row => {
                    delete row.id;

                    return row;
                });
        
                fs.writeFileSync(
                    __dirname + `/../src/example-configs/${marketplaceType}/categories.json`,
                    JSON.stringify(obj, undefined, 2),
                    "utf8"
                );
        
                cb();
            });
        }
    ], err => {

    });
});
