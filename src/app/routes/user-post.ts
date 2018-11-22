
import { Application } from "express";
import { isLoggedIn } from "../controllers/responseController";
import { IVQModels, IVQRequest } from "../interfaces";

const slug = require("slug");
const striptags = require("striptags");

const getDraft = async (models: IVQModels, userId: number) => {
    let draft = await models.userPost.findOne({
        include: [{ all: true }],
        where: {
            $and: [
               { userId },
               { status: "draft" },
               { postTypeId: "article" }
            ]
        }
    });

    if (!draft) {
        draft = await models.userPost.create({
            postTypeId: "article",
            status: "draft",
            userId
        });

        draft = await models.userPost.findOne({
            include: [{ all: true }],
            where: {
                $or: [
                    { id: draft.id }
                ]
            }
        });
    }

    return draft;
};

const prepareHashtags = (hashtags: string[] | string): string[] => {
    // tslint:disable-next-line:align
    if (typeof hashtags === "string") {
        try {
            hashtags = hashtags.split(",");
        } catch (err) {
            hashtags = [];
        }
    }

    // tslint:disable-next-line:align
	if (typeof hashtags === "object") {
        hashtags = hashtags.filter((item) => item.length > 2);
    }

    // get the first 6 elements
    return hashtags.slice(0, 6);
};

const addHashtagsToPost = async (models: IVQModels, userPostId: number, hashtags: string[] | string) => {
    hashtags = prepareHashtags(hashtags);

    await models.userPostHashtag.destroy({
        where: {
            userPostId
        }
    });

    for (const hashtag of hashtags) {
        await models.userPostHashtag.create({
            hashtag,
            userPostId
        });
    }
};

export default (app: Application) => {
    app.get("/api/post/:idOrAlias", async (req: IVQRequest, res) => {
        const idOrAlias = req.params.idOrAlias.toLowerCase();

        const post = await req.models.userPost.findOne({
            include: [{ all: true }],
            where: {
                $or: [
                    { id: idOrAlias },
                    { alias: idOrAlias }
                ]
            }
        });

        res.status(200).send(post);
    });

    app.get("/api/draft", isLoggedIn, async (req: IVQRequest, res) => {
        let draft;

        try {
            draft = await getDraft(req.models, req.user.id);
        } catch (err) {
            return res.status(400).send(err);
        }

        res.status(200).send(draft);
    });

    app.put("/api/draft/:postId/:element(body|title|hashtags)", isLoggedIn, async (req: IVQRequest, res) => {
        const draft = await req.models.userPost.findOne({ where: {
            $and: [
                { userId: req.user.id },
                { id: req.params.postId }
            ]
        }});

        if (!draft) {
            res.status(400).send({ code: "NOT_FOUND" });
        }

        const body = req.body as {
            body: string;
            title: string;
            hashtags: string;
        };

        const element = req.params.element as "body" | "title" | "hashtags";

        const post = await req.models.userPost.findOne({
            where: {
                $and: [
                    { userId: req.user.id },
                    { id: req.params.postId }
                ]
            }
        });

        if (!post) {
            res.status(400).send({
                code: "POST_NOT_FOUND"
            });
        }

        if (element === "hashtags") {
            await addHashtagsToPost(req.models, req.params.postId, body.hashtags);
        } else {
            draft[element] = element === "title" ? striptags(body[element]) : body[element];

            await draft.save();
        }

        res.status(200).send(draft);
    });

    app.put("/api/draft/:postId/publish", isLoggedIn, async (req: IVQRequest, res) => {
        const post = await req.models.userPost.findOne({
            where: {
                $and: [
                   { userId: req.user.id },
                   { id: req.params.postId }
                ]
            }
        });

        if (!post.title || post.title.length < 10) {
            return res.status(400).send({ code: "TITLE_TOO_SHORT" });
        }

        if (!post.body || post.body.length < 100) {
            return res.status(400).send({ code: "TEXT_TOO_SHORT" });
        }

        if (!post) {
            return res.status(400).send({ code: "POST_NOT_FOUND" });
        }

        post.alias = `${slug(post.title).toLowerCase()}-${post.id}`;
        post.status = "published";

        await post.save();

        return res.status(200).send(post);
    });
};
