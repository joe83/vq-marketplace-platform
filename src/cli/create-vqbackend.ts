import * as tenantServices from "../app-tenant/service";

require('dotenv').config();

const TYPE = process.argv[2] || "blank";
const TENANT_ID = process.argv[3] || "vqbackend";
const TARGET_LANG = process.argv[4] || "en";
const EMAIL = process.argv[5] || "info+vqbackend@vq-labs.com";

// node ./build/cli/create-vqbackend.js honestcash honestcash en info@vq-labs.com

export const createMarketplace = (tenantId: string, cb: (err: any) => void) => {
    tenantServices.createNewTenant({
        status: 3,
        tenantId,
        emailVerified: true,
        email: EMAIL,
        source: "native"
    }, (err, tenant) => {
        if (err) {
            console.error(err);

            return cb(err);
        }

        tenantServices.deployNewMarketplace(tenant.tenantId, tenant.apiKey, "test", "test", TYPE, {}, (err: any) => {
            if (err) {
                console.error(err);

                return cb(err);
            }

            console.error(`New marketplace "${tenant.tenantId}" has been successfully created / updated!`);

            return cb(undefined);
        });
    });
};

if (!module.parent) {
    createMarketplace(TENANT_ID, (err) => {
        if (err) {
            console.error(err);
        }

        return process.exit();
    });
}
