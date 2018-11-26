
import { Response } from "express";
import { getEmailsFromUserId } from "../../../auth";
import { IVQRequest } from "../../../interfaces";
import { getEmailAndSend } from "../../../services/emailService";

/**
 * @api {put} /api/admin/user/:userId/activate Activates user account and sends an e-mail to him.
 * @apiVersion 0.0.2
 * @apiGroup Admin
 *
 * @apiParam {String} userId Users ID
 */
export default async (req: IVQRequest, res: Response) => {
    const userId = req.params.userId;

    const user = await req.models.user.findOne({ where: { id: userId } });

    if (!user) {
        return res.status(404).send({
            code: "NOT_FOUND"
        });
    }

    user.status = "11";

    await user.save();

    getEmailsFromUserId(req.models, user.vqUserId, (err: any, emails) => {
        if (err) {
            return console.log(err);
        }

        getEmailAndSend(req.models, "user-activated", emails, {});
    });

    res.status(204).send(user);
};
