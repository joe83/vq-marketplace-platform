
import { Response } from "express";
import { IVQRequest } from "../../../interfaces";

const deleteProfile = async (req: IVQRequest, userId: number) => {
    const where = { userId };
    const whereUser = { id: userId };
    const seqOpts = { force: true, where };

    await req.models.userProperty.destroy(seqOpts);

    await req.models.userPreference.destroy(seqOpts);

    await req.models.user.destroy({ force: true, where: whereUser });
};

const deleteAuthUser = async (req: IVQRequest, vqUserId: number) => {
    const where = { userId: vqUserId };
    const seqOpts = { where, force: true };

    await req.models.userEmail.destroy(seqOpts);

    await req.models.userToken.destroy(seqOpts);

    await req.models.userNetwork.destroy(seqOpts);

    await req.models.userResetCode.destroy(seqOpts);

    await req.models.userAuth.destroy({ force: true, where: { id: vqUserId }});
};

/**
 * @api {delete} /api/admin/user/:userId/delete Deletes user data
 * @apiVersion 0.0.2
 * @apiGroup Admin
 *
 * @apiParam {String} userId Users ID
 */
export default async (req: IVQRequest, res: Response) => {
    const user = await req.models.user.findById(Number(req.params.userId), { paranoid: false });

    if (!user) {
        return res.status(404).send({code: "NOT_FOUND"});
    }

    if (user.isAdmin) {
        return res.status(400).send({ code: "CANNOT_DELETE_ADMIN" });
    }

    await deleteProfile(req, user.id);

    await deleteAuthUser(req, user.vqUserId);

    res.status(204).send({ ok: true });
};
