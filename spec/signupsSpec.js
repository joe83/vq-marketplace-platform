const request = require("request");
const server = require("../build/server");
const createVqbackend = require("../build/cli/create-vqbackend");
const deleteLocalDb = require("../build/cli/delete-local-db");
const tenantUrl = `http://localhost:${process.env.PORT}`;
const cryptoService = require("../build/app/services/cryptoService");

const TEST_DATA = {
    FIRST_NAME: "firstNameTest",
    LAST_NAME: "lastNameTest",
    EMAIL: "info@vq-labs.com",
    COUNTRY: "de",
    MARKETPLACE_TYPE: "blank"
};

const TENANT_ID = "test-signup";

let demandUserAuthToken;

describe("Authentification", () => {
    let supplyUserId, demandUserId;

    beforeAll(done => {
        deleteLocalDb.run(() => {
            createVqbackend.createMarketplace(TENANT_ID, (err) => {
                server.setupApp(() => {
                    server.setTenantIdForTesting(TENANT_ID);

                    done(err);
                });
            });
        });
    });

    it("POST /api/signup/email", done => {
        request({
            url: `${tenantUrl}/api/signup/email`,
            method: "POST",
            json: {
                email: "info+supply@vq-labs.com",
                password: "test",
                firstName: "userSupplyFirstName",
                lastName: "userSupplyLstName",
                userType: 2, // supply
                props: {
                    propOne: "one",
                    propTwo: "two"
                }
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            if (response.statusCode !== 200) {
                console.log(body);
            }

            expect(body.token).toBeDefined();
            expect(body.userId).toBeDefined();

            expect(body.user).toBeDefined();
            expect(body.user.userType).toBe(2);
            expect(body.user.firstName).toBe("userSupplyFirstName");
            expect(body.user.isAdmin).toBe(false);
            expect(body.user.userProperties).toBeDefined();
            expect(body.user.userProperties.find(_ => _.propKey === "propOne").propValue).toBe("one");

            supplyUserId = body.user.id;

            done();
        });
    });

    it("GET (tenant) /api/signup/email", done => {
        request({
            url: `${tenantUrl}/api/signup/email`,
            method: "POST",
            json: {
                email: "info+demand@vq-labs.com",
                password: "test",
                firstName: "userDemandFirstName",
                lastName: "userDemandLastName",
                userType: 1 // supply

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.token).toBeDefined();
            expect(body.userId).toBeDefined();
            
            expect(body.user).toBeDefined();
            expect(body.user.firstName).toBe("userDemandFirstName");
            expect(body.user.userType).toBe(1);
            expect(body.user.isAdmin).toBe(false);

            demandUserId = body.user.id;

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

    it("GET (tenant) /api/verify/email (verify demand user)", done => {
        request({
            url: `${tenantUrl}/api/verify/email?code=${cryptoService.encodeObj({ id: demandUserId })}`,
            method: "GET",
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("GET (tenant) /api/user/<supply-user>", done => {
        const url = `${tenantUrl}/api/user/${supplyUserId}`;

        request({
            url,
            method: "GET",
        }, (error, response, body) => {
            body = JSON.parse(body);
            expect(response.statusCode).toBe(200);
            expect(body.id).toBe(supplyUserId);

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

            adminUserAuthToken = body.token;
        
            done();
        });
    });

    it("POST (tenant) /api/login", done => {
        const url = `${tenantUrl}/api/login`;

        request({
            url,
            method: "POST",
            json: {
                email: "info+supply@vq-labs.com",
                password: "test",
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.token).toBeDefined();

            supplyUserAuthToken = body.token;
        
            done();
        });
    });

    it("POST (tenant) /api/login", done => {
        const url = `${tenantUrl}/api/login`;

        request({
            url,
            method: "POST",
            json: {
                email: "info+demand@vq-labs.com",
                password: "test",
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.token).toBeDefined();

            demandUserAuthToken = body.token;                            
        
            done();
        });
    });

    it("PUT (tenant) /api/user/:userId", done => {
        const url = `${tenantUrl}/api/user/` + demandUserId;

        request({
            url,
            method: "PUT",
            json: {
                props: {
                    "testProp": "testPropValue",
                    "testProp2": "testPropValue2",
                    "testProp3": undefined
                }
            },
            headers: {
                "x-auth-token": demandUserAuthToken
            },
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.userProperties.find(_ => _.propKey === "testProp").propValue).toBe("testPropValue");

            done();
        });
    });




    it("DELETE (tenant) /api/user/:userId", done => {
        const url = `${tenantUrl}/api/user/` + demandUserId;
  
        request({
            url,
            method: "DELETE",
            headers: {
                "x-auth-token": demandUserAuthToken
            },
        }, (error, response) => {
            expect(response.statusCode).toBe(200);

            done();
        });
    });
});
