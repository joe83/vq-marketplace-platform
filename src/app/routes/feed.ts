
import { Application } from "express";
import { IVQRequest } from "../interfaces";

const striptags = require("striptags");

export default (app: Application) => {
    app.get("/api/feeds", async (req: IVQRequest, res) => {
        const query = req.query as {
            hashtag: string;
            userId: string;
            page: string;
        };

        const hashtagWhereConstraints = query.hashtag ? { hashtag: String(query.hashtag) } : undefined;
        const userWhereConstraints = query.userId ? { id: Number(query.userId) } : undefined;

        const limit = 20;
        const page = Number(query.page) || 1;
        const offset = limit * (page - 1);

        const userPosts = await req.models.userPost.findAll({
            include: [
                {
                    model: req.models.userPostHashtag,
                    required: !!hashtagWhereConstraints,
                    where: hashtagWhereConstraints
                },
                { model: req.models.user, where: userWhereConstraints }
            ],
            limit,
            offset,
            order: [[ "publishedAt", "DESC" ]],
            where: {
                $and: [
                    { status: "published" }
                ]
            }
        });

        for (const post of userPosts) {
            post.body = striptags(post.body);

            if (post.body && post.body.length > 400) {
                post.body = post.body.substring(0, 400) + "...";
                post.isFull = false;
            } else {
                post.isFull = true;
            }
        }

        res.status(200).send(userPosts);
    });
};
