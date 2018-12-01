
import { Application } from "express";
import { identifyUser, isLoggedIn } from "../controllers/responseController";
import { IVQModels, IVQRequest } from "../interfaces";
import { prepareHashtags } from "../utils";
const slug = require("slug");
const striptags = require("striptags");
import userPostEmitter from "../events/userPost";

const getDraft = async (models: IVQModels, userId: number, parentPostId: number) => {
    const whereAndConditions: any[] = [
        { userId },
        { status: "draft" },
        { postTypeId: "article" }
    ];

    let parentPost;
    let draft;

    if (parentPostId) {
        parentPost = await models.userPost.findOne({
            include: [
                { model: models.user }
            ],
            where: {
                id: parentPostId
            }
        });

        if (!parentPost) {
            throw new Error("PARENT_POST_NOT_FOUND");
        }

        whereAndConditions.push({ parentPostId });
    } else {
        whereAndConditions.push({ parentPostId: null });
    }

    draft = await models.userPost.findOne({
        include: [{ all: true }],
        where: {
            $and: whereAndConditions
        }
    });

    if (!draft) {
        const postBody: { postTypeId: string, status: string, userId: number, parentPostId?: number } = {
            postTypeId: "article",
            status: "draft",
            userId
        };

        if (parentPostId) {
            postBody.parentPostId = parentPostId;
        }

        draft = await models.userPost.create(postBody);

        draft = await models.userPost.findOne({
            include: [{ all: true }],
            where: {
                $or: [
                    { id: draft.id }
                ]
            }
        });
    }

    draft = JSON.parse(JSON.stringify(draft));

    draft.parentPost = parentPost;

    return draft;
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
    /**
     * @api {get} /api/post/:idOrAlias Post identifier
     * @apiVersion 0.0.2
     * @apiGroup Post
     *
     * @apiParam {idOrAlias} ID of the post or an identifier
     */
    app.get("/api/post/:idOrAlias", async (req: IVQRequest, res) => {
        const idOrAlias = req.params.idOrAlias.toLowerCase();

        const postObj = await req.models.userPost.findOne({
            include: [
                {
                    include: [ { model: req.models.user } ],
                    model: req.models.userPost,
                    required: false,
                    where: { status: "published" }
                },
                { model: req.models.userPostHashtag },
                { model: req.models.userPostUpvote, required: false },
                { model: req.models.user }
            ],
            plain: true,
            where: {
                $or: [
                    { id: idOrAlias },
                    { alias: idOrAlias }
                ]
            }
        });

        if (!postObj) {
            return res.status(404).send({ code: "NOT_FOUND" });
        }

        const post = postObj.dataValues;

        if (post.parentPostId) {
            const parentPostObj = await req.models.userPost.findOne({
                include: [
                    { model: req.models.user }
                ],
                where: {
                    $or: [
                        { id: post.parentPostId }
                    ]
                }
            });

            post.parentPost = parentPostObj.dataValues;
        }

        res.status(200).send(post);
    });

    app.post("/api/post/:postId/upvote", identifyUser, async (req: IVQRequest, res) => {
        const body: { txId: string, postId: number } = req.body;

        const post = await req.models.userPost.findById(body.postId);

        if (!post) {
            return res.status(400).send({
                code: "POST_NOT_FOUND"
            });
        }

        await req.models.userPostUpvote.create({
            blockchain: "bch",
            txId: body.txId,
            userId: req.user ? req.user.id : undefined,
            userPostId: body.postId
        });

        res.status(200).send({ ok: true });
    });

    app.get("/api/draft", isLoggedIn, async (req: IVQRequest, res) => {
        let draft;

        try {
            draft = await getDraft(req.models, req.user.id, req.query.parentPostId);
        } catch (errCode) {
            return res.status(400).send({
                code: errCode
            });
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
            return res.status(400).send({
                code: "NOT_FOUND"
            });
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
            include: [{ model: req.models.user }],
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

        if (post.status !== "published") {
            post.alias = `${slug(post.title).toLowerCase()}-${post.id}`;
            post.publishedAt = new Date();
            post.status = "published";

            userPostEmitter.emit("new-user-post", req.models, post);
        }

        await post.save();

        return res.status(200).send(post);
    });
};
