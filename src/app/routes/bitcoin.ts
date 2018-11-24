const BITBOXSDK = require("bitbox-sdk/lib/bitbox-sdk").default;
const BITBOX = new BITBOXSDK();

import { Application } from "express";

export default (app: Application) => {
    app.get("/api/bitcoin/utils/validate/:address", async (req, res) => {
        const address = req.params.address;

        const validateAddress = await BITBOX.Util.validateAddress(address);

        res.status(200).send(validateAddress);
    });
};
