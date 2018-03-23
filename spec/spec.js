const request = require("request");
const server = require("../build/server");
const deleteLocalDb = require("../scripts/delete-local-db");

const baseUrl = `http://localhost:${process.env.TENANT_PORT}`;
const tenantUrl = `http://localhost:${process.env.PORT}`;

// services
const cryptoService = require("../build/app/services/cryptoService");

const TEST_DATA = {
    FIRST_NAME: "firstNameTest",
    LAST_NAME: "lastNameTest",
    EMAIL: "info@vq-labs.com",
    COUNTRY: "de",
    MARKETPLACE_TYPE: "services"
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
    let supplyUserId, demandUserId;
    let supplyUserAuthToken, demandUserAuthToken;
    let supplyTaskId;

    beforeAll(done => {
        deleteLocalDb.run(() => {
            server.setupApp(() => {
                done();
            });
        });
    });

    it("GET /api/tenants returns status 200", done => {
        request.get(`${baseUrl}/api/tenant`, (error, response, body) => {
            // returns an empty array
            expect(JSON.parse(body).length).toBe(0);
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

            done();
        });
    });


    it("POST /api/trial-registration/step-1 with existing email", done => {
        trialRegistrationStep1((error, response, body) => {
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
            console.log(body)
            expect(response.statusCode).toBe(200);

            expect(body.tenant.emailVerified).toBe(true);
            expect(body.tenant.status).toBe(0);

            done();
        });
    });


    //  @todo Review it Why does it return { tenant: [ 1 ] }
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
            console.log(body);
            expect(response.statusCode).toBe(200);

            // expect(body.tenant.emailVerified).toBe(true);
            // expect(body.tenant.firstName).toBe(true);

            done();
        });
    });

    //  @todo Review it Why does it return { tenant: [ 1 ] }
    it("POST /api/trial-registration/step-4", done => {
        request({
            url: `${baseUrl}/api/trial-registration/step-4`,
            method: "POST",
            json: {
                apiKey: tenantData.apiKey,
                marketplaceType: TEST_DATA.MARKETPLACE_TYPE,
                marketplaceName: "myTestMarketplace",
                password: "test",
                repeatPassword: "test"
            }
        }, (error, response, body) => {
            // console.log(body);
            expect(response.statusCode).toBe(200);

            done();
        });
    }, 20000);

    it("POST /api/trial-registration/getTenantStatus", done => {
        // interval because the previous task is asynchronous
        setInterval(() => {
            request({
                url: `${baseUrl}/api/trial-registration/getTenantStatus`,
                method: "POST",
                json: {
                    apiKey: tenantData.apiKey
                }
            }, (error, response, body) => {
                if (response.statusCode === 200) {
                    expect(body.tenant.tenantId).toBe("mytestmarketplace");
                    expect(body.tenant.status).toBe(3);

                    server.setTenantIdForTesting(body.tenant.tenantId);

                    done();
                }
            });
        }, 2000);
    }, 20000);

    it("GET (tenant) /api/app_config", done => {
        request({
            url: `${tenantUrl}/api/app_config`,
            method: "GET",
        }, (error, response, body) => {
            const parsedBody = JSON.parse(body);

            expect(response.statusCode).toBe(200);
            expect(parsedBody[0].fieldKey).toBeDefined();

            expect(
                parsedBody
                .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS_REQUEST_STEP_MULTIPLE_REQUESTS_ENABLED")
                .fieldValue === "0"
            ).toBeTruthy();

            done();
        });
    });

    it("GET (tenant) /api/app_label", done => {
        request({
            url: `${tenantUrl}/api/app_label?lang=en`,
            method: "GET",
        }, (error, response, body) => {
            const parsedBody = JSON.parse(body);
            
            expect(response.statusCode).toBe(200);
            expect(parsedBody[0].labelKey).toBeDefined();

            done();
        });
    });

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

    it("POST (tenant) /api/task - create task draft (status: 10)", done => {
        const url = `${tenantUrl}/api/task`;

        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": supplyUserAuthToken
            },
            json: {

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.status).toBe('10');
            expect(body.taskType).toBe(2);
            expect(body.userId).toBe(supplyUserId);

            done();
        });
    });

    it("POST (tenant) /api/task - create task draft (status: 10)", done => {
        const url = `${tenantUrl}/api/task`;

        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": supplyUserAuthToken
            },
            json: {

            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            supplyTaskId = body.id;

            expect(body.status).toBe('10');
            expect(body.taskType).toBe(2);
            expect(body.userId).toBe(supplyUserId);

            done();
        });
    });

    it("PUT (tenant) /api/task/<taskId> - publish task as wrong user", done => {
        const url = `${tenantUrl}/api/task/${supplyTaskId}`;

        request({
            url,
            method: "PUT",
            headers: {
                "x-auth-token": demandUserAuthToken
            },
            json: {
                title: "Example task",
                description: "Example task description",
            }
        }, (error, response) => {
            expect(response.statusCode).toBe(400);

            done();
        });
    });

    it("PUT (tenant) /api/task/<taskId> - publish task", done => {
        const url = `${tenantUrl}/api/task/${supplyTaskId}`;

        request({
            url,
            method: "PUT",
            headers: {
                "x-auth-token": supplyUserAuthToken
            },
            json: {
                title: "Example task",
                description: "Example task description",
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.status).toBe('0');
            
            done();
        });
    });

    it("POST (tenant) /api/request", done => {
        const url = `${tenantUrl}/api/request`;
  
        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": demandUserAuthToken
            },
            json: {
                taskId: supplyTaskId,
                // now the message is required! shoule we leave it like that?
                message: "hello!"
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(200);

            expect(body.fromUserId).toBe(demandUserId);
            expect(body.toUserId).toBe(supplyUserId);
            expect(body.taskId).toBe(supplyTaskId);
            
            done();
        });
    });

    it("POST (tenant) /api/request - double requests are not possible", done => {
        const url = `${tenantUrl}/api/request`;
  
        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": demandUserAuthToken
            },
            json: {
                taskId: supplyTaskId,
                // now the message is required! shoule we leave it like that?
                message: "hello!"
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(400);
            expect(body.code).toBe('REQUEST_ALREADY_CREATED');
            
            done();
        });
    });

    /**
     * this fails now, because it is possible to send requests for own listings! It should not be!
    it("POST (tenant) /api/request - send request for my own listings", done => {
        const url = `${tenantUrl}/api/request`;
  
        request({
            url,
            method: "POST",
            headers: {
                "x-auth-token": supplyUserAuthToken
            },
            json: {
                taskId: supplyTaskId,
                // now the message is required! shoule we leave it like that?
                message: "hello!"
            }
        }, (error, response, body) => {
            expect(response.statusCode).toBe(400);
            
            done();
        });
    });
    */

    /**
     * @todos
     */

    /**
    it("Create an order for a request", done => {
        done();
    });

    it("Mark order as done (supply side)", done => {
        done();
    });

    it("Mark order as done (demand side)", done => {
        done();
    });

    it("Leave review (demand side)", done => {
        done();
    });

    it("Leave review (demand side)", done => {
        done();
    });
    */
    
    /**
     * Here will go tests for fractural allocation of assets!
     */
});