const request = require("request");
const server = require("../build/server");
const createVqbackend = require("../build/cli/create-vqbackend");
const deleteLocalDb = require("../build/cli/delete-local-db");
const tenantUrl = `http://localhost:${process.env.PORT}`;
const cryptoService = require("../build/app/services/cryptoService");

describe("Authentification", () => {
    const TENANT_ID = "test-signup";

    const TEST_DATA = {
        FIRST_NAME: "firstNameTest",
        LAST_NAME: "lastNameTest",
        EMAIL: "info+test@vq-labs.com",
        EMAIL_SUPPLY: "info+supply@vq-labs.com",
        EMAIL_DEMAND: "info+demand@vq-labs.com",
        PASSWORD: "test",
        COUNTRY: "de",
        MARKETPLACE_TYPE: "blank"
    };

    let demandUserId;
    let demandUserAuthToken;

    beforeAll(done => {
        deleteLocalDb.run(undefined, () => {
            createVqbackend.createMarketplace(TENANT_ID, (err) => {
                server.setupApp(() => {
                    server.setTenantIdForTesting(TENANT_ID);

                    done(err);
                });
            });
        });
    });

    afterAll(done => {
        deleteLocalDb.run(undefined, () => {
            console.log("Database deleted!");

            done();
        });
    });

    it("POST (tenant) /api/signup/email Creates demand user", done => {
        request({
            url: `${tenantUrl}/api/signup/email`,
            method: "POST",
            json: {
                email: TEST_DATA.EMAIL_DEMAND,
                password: TEST_DATA.PASSWORD,
                firstName: "userDemandFirstName",
                lastName: "userDemandLastName",
                userType: 1, // demand,
                props: {
                    propOne: "one",
                    propTwo: "two"
                }

            }
        }, (error, response, body) => {
            if (response.statusCode !== 200) {
                console.log(response);
            }

            expect(response.statusCode).toBe(200);

            expect(body.token).toBeDefined();
            expect(body.userId).toBeDefined();
            
            expect(body.user).toBeDefined();
            expect(body.user.firstName).toBe("userDemandFirstName");
            expect(body.user.userType).toBe(1);
            expect(body.user.isAdmin).toBe(false);
            expect(body.user.userProperties).toBeDefined();
            expect(body.user.userProperties.find(_ => _.propKey === "propOne").propValue).toBe("one");

            demandUserId = body.user.id;

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

    it("POST (tenant) /api/login for demand side", done => {
        const url = `${tenantUrl}/api/login`;

        request({
            url,
            method: "POST",
            json: {
                email: TEST_DATA.EMAIL_DEMAND,
                password: TEST_DATA.PASSWORD,
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body.token).toBeDefined();

            demandUserAuthToken = body.token;                            
        
            done();
        });
    });

    it("PUT (tenant) /api/user/:userId Updates demand user", done => {
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

    it("PUT (tenant) /api/user/:userId Updates demand user without props", done => {
        const url = `${tenantUrl}/api/user/` + demandUserId;

        request({
            url,
            method: "PUT",
            json: {},
            headers: {
                "x-auth-token": demandUserAuthToken
            },
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            done();
        });
    });

    it("DELETE (tenant) /api/user/:userId Deletes demand user", done => {
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
