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
export interface IAPIError {
    code: string;
    httpCode: 400 | 500;
    desc?: string;
    message?: string;
}

export type TStandardCallback = (err?: IAPIError, result?: any) => void;

export interface IAccountData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 0 | 1 | 2,
    props: {
        [propKey: string]: string;
    }
}