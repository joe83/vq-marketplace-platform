export interface VQExpressRequest extends Express.Request {
    models: any;
    params: any;
    user: any;
    body: any;
}
