const async = require("async");
const request = require("request");
const server = require("../built/server");
const deleteLocalDb = require("../scripts/delete-local-db");

const baseUrl = "http://localhost:8081";
const tenantUrl = "http://localhost:8080";

// services
const cryptoService = require("../built/app/services/cryptoService");

const TEST_DATA = {
    FIRST_NAME: "firstNameTest",
    LAST_NAME: "lastNameTest",
    EMAIL: "info@vq-labs.com",
    COUNTRY: "de",
    MARKETPLACE_TYPE: "rentals"
};

const trialRegistrationStep1 = (cb) => {
    request({
        url: `${baseUrl}/api/trial-registration/step-1`,
        method: "POST",
        json: {
            email: TEST_DATA.EMAIL
        }
    }, cb);
};

describe("Starts a new marketplace", () => {
    let tenantData;
    let supplyUserId;
    let adminAuthToken;

    beforeAll(done => {
        deleteLocalDb.run(() => {
            server.setupApp(() => {
                done();
            });
        });
    });

    it("GET /api/tenants returns status 200", done => {
        request.get(`${baseUrl}/api/tenant`, (error, response) => {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("POST /api/trial-registration/step-1 with new email", done => {
        trialRegistrationStep1((error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.tenant).toBeDefined();
            expect(body.tenant.email).toBe(TEST_DATA.EMAIL);
            expect(body.tenant.status).toBe(0);

            tenantData = body.tenant;
            
            // console.log(body);

            done();
        });
    });
 
    it("POST /api/trial-registration/step-2 with existing email", done => {
        request({
            url: `${baseUrl}/api/trial-registration/step-2`,
            method: "POST",
            json: {
                verificationCode: cryptoService.encodeObj(tenantData.apiKey)
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.tenant.emailVerified).toBe(true);
            expect(body.tenant.status).toBe(0);

            console.log(body);

            done();
        });
    });

    /**
     * Why does it return { tenant: [ 1 ] }
     * @todo Review it
     */
    it("POST /api/trial-registration/step-3", done => {
        request({
            url: `${baseUrl}/api/trial-registration/step-3`,
            method: "POST",
            json: {
                apiKey: tenantData.apiKey,
                firstName: TEST_DATA.FIRST_NAME,
                lastName: TEST_DATA.LAST_NAME,
                country: TEST_DATA.COUNTRY,
            }
        }, (error, response, body) => {
            // console.log(body);
            expect(response.statusCode).toBe(200);

            // expect(body.tenant.emailVerified).toBe(true);
            // expect(body.tenant.firstName).toBe(true);

            done();
        });
    });

    /**
     * Why does it return { tenant: [ 1 ] }
     * @todo Review it
     */
    it("POST /api/trial-registration/step-4", done => {
        request({
            url: `${baseUrl}/api/trial-registration/step-4`,
            method: "POST",
            json: {
                apiKey: tenantData.apiKey,
                marketplaceType: "rentals",
                marketplaceName: "myTestMarketplace",
                password: "test",
                repeatPassword: "test"
            }
        }, (error, response, body) => {
            // console.log(body);
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("POST /api/trial-registration/getTenantStatus", done => {
        // timeout because the previous task is asynchronous
        setTimeout(() => {
            request({
                url: `${baseUrl}/api/trial-registration/getTenantStatus`,
                method: "POST",
                json: {
                    apiKey: tenantData.apiKey
                }
            }, (error, response, body) => {
                expect(response.statusCode).toBe(200);
                expect(body.tenant.tenantId).toBe("mytestmarketplace");
                expect(body.tenant.status).toBe(3);

                server.setTenantIdForTesting(body.tenant.tenantId);

                done();
            });
        }, 1000);
    });

    /**
     * Create a first user - admin
     */
    it("GET (tenant) /api/signup/email", done => {
        request({
            url: `${tenantUrl}/api/signup/email`,
            method: "POST",
            json: {
                email: "info+supply@vq-labs.com",
                password: "test",
                firstName: "userSupplyFirstName",
                lastName: "userSupplyLstName",
                userType: 2 // supply

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.token).toBeDefined();
            expect(body.userId).toBeDefined();

            expect(body.user).toBeDefined();
            expect(body.user.userType).toBe(2);
            expect(body.user.firstName).toBe("userSupplyFirstName");
            expect(body.user.isAdmin).toBe(false);

            supplyUserId = body.user.id;

            done();
        });
    });

    it("GET (tenant) /api/verify/email (verify supply user)", done => {
        const url = `${tenantUrl}/api/verify/email?code=${cryptoService.encodeObj({ id: supplyUserId })}`;

        request({
            url,
            method: "GET",
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            done();
        });
    });
    
    it("GET (tenant) /api/subscription/plans", done => {
        const url = `${baseUrl}/api/subscription/plans`;

        request({
            url,
            method: "GET",
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            console.log(body);
        
            done();
        });
    });

    it("POST (tenant) /api/login", done => {
        const url = `${tenantUrl}/api/login`;

        request({
            url,
            method: "POST",
            json: {
                email: TEST_DATA.EMAIL,
                password: "test",
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.token).toBeDefined();

            adminAuthToken = body.token;
        
            done();
        });
    });

    it("POST (tenant) /api/admin/new-subscription/starter - Init sub checkout", done => {
        const url = `${tenantUrl}/api/admin/new-subscription/starter`;

        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": adminAuthToken
            },
            json: {

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            console.log(body);

            done();
        });
    });

    it("POST (tenant) /api/admin/subscription-portal - Get portal auth", done => {
        const url = `${tenantUrl}/api/admin/subscription-portal`;

        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": adminAuthToken
            },
            json: {

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            console.log(body);

            done();
        });
    });
});