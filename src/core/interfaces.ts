export interface VQExpressRequest extends Express.Request {
    models: any;
    params: any;
    user: any;
    body: any;
}
export namespace VQ {
    export interface APIError {
        code: string;
        httpCode: 400 | 500;
        desc?: string;
    }

    export type StandardCallback = (err?: VQ.APIError, result?: any) => void;
}
