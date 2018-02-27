const async = require("async");
const request = require("request");
const server = require("../built/server");
const deleteLocalDb = require("../scripts/delete-local-db");
const baseUrl = "http://localhost:8081"

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
 
    it("POST /api/trial-registration/step-1 with existing email", done => {
        trialRegistrationStep1(function(error, response, body) {
            expect(response.statusCode).toBe(400);
            expect(body.code).toBe("TENANT_EMAIL_TAKEN");
            expect(body.httpCode).toBe(400);

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

                done();
            });
        }, 1000);
    });
});