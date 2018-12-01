import { EMAILS, getEmailAndSend } from "../services/emailService";

const EventEmitter = require("events");

class DefaultEmitter extends EventEmitter {}
const userPostEmitter = new DefaultEmitter();

userPostEmitter.on("new-user-post", async (models: any, userPost: { title: string, userId: number }) => {
    const followers = await models.userFollower.findAll({
        where: {
            followingId: userPost.userId
        }
    });

    const followerEmails = [];

    for (const follower of followers) {
        const user = await models.user.findById(follower.userId);

        const email = await models.userEmail.findOne({
            where: {
                userId: user.vqUserId
            }
        });

        followerEmails.push(email.email);
    }

    if (!followerEmails.length) {
        return followerEmails;
    }

    return getEmailAndSend(models, EMAILS.NEW_USER_POST, followerEmails, {
        USER_POST: userPost
    });
});

export default userPostEmitter;
