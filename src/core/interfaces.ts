
export namespace VQ {
    export interface APIError {
        code: string;
        httpCode: 400 | 500;
        desc?: string;
        message?: string;
        data?: any
    }

    export type StandardCallback = (err?: VQ.APIError, result?: any) => void;

    export interface AccountData {
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
    export interface Request extends Express.Request {
        body: any;
        models: any;
        user: any;
    }
}
