var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require('dotenv').config();
const async = require("async");
const db = require('../app/models/models.js');
const USECASE = "honestcash";
const TENANT_ID = "honestcash";
if (!TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}
if (!USECASE) {
    throw new Error('Specify USECASE');
}
db.create(TENANT_ID, USECASE, () => __awaiter(this, void 0, void 0, function* () {
    const models = db.get(TENANT_ID);
    const userEmails = yield models.userEmail.findAll({ where: { id: { $and: [ {[models.seq.Op.gt]: 115}, {[models.seq.Op.lt]: 220} ] }}});
    for (let user of userEmails)
        console.log(user.email);
}));
