import { Application, Request } from "express";

export interface IVQModels {
    // meta
    tenantId: string;

    //
    user: any;
    userProperty: any;
    userPreference: any;
    userPost: any;
    // auth
    userEmail: any;
    userNetwork: any;
    userPaymentAccount: any;
    userPassword: any;
    userToken: any;
    userResetCode: any;
    userAuth: any;
    userPostHashtag: any;

    // App
    appConfig: any;
}

export interface IVQRequest extends Request {
    models: IVQModels;
    user: {
        id: number
    };
}
