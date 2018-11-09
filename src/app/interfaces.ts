import { Application, Request } from "express";

interface IVQModels {
    user: any;
    userProperty: any;
    userPreference: any;
    // auth
    userEmail: any;
    userNetwork: any;
    userPaymentAccount: any;
    userPassword: any;
    userToken: any;
    userResetCode: any;
    userAuth: any;
}

export interface IVQRequest extends Request {
    models: IVQModels;
}
