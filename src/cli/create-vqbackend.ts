import * as tenantServices from "../app-tenant/service";

require('dotenv').config();

const TENANT_ID = "vqbackend";

export const createMarketplace = (tenantId: string, cb: (err: any) => void) => {
    tenantServices.createNewTenant({
        status: 3,
        tenantId,
        emailVerified: true,
        email: "info+vqbackend@vq-labs.com",
        source: "native"
    }, (err, tenant) => {
        if (err) {
            console.error(err);
            
            return cb(err);
        }
    
        tenantServices.deployNewMarketplace(tenant.tenantId, tenant.apiKey, "test", "test", "blank", {}, (err: any) => {
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
