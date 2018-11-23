const slug = require("slug");
import { IAPIError } from "../interfaces";

export const cleanHashtag = (hashtag: string): string => {
    let cleanedHashtag = hashtag.split("#").join("");

    cleanedHashtag = slug(cleanedHashtag);

    return cleanedHashtag;
};

export const removeDuplicates = (array: string[]) => {
    const seen: { [ item: string ]: boolean} = {};

    return array.filter((item) => {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
};

export const prepareHashtags = (hashtags: string[] | string): string[] => {
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

    hashtags = removeDuplicates(hashtags);

    // get the first 6 elements
    hashtags = hashtags.slice(0, 6);

    hashtags = hashtags.map((hashtag) => {
        return cleanHashtag(hashtag);
    });

    return hashtags;
};

export const stringToSlug = str => {
    str = str.replace(/^\s+|\s+$/g, ""); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";

    for (var i = 0, l = from.length; i < l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
        .replace(/\s+/g, "-") // collapse whitespace and replace by -
        .replace(/-+/g, "-"); // collapse dashes

    return str;
};

export const transformJSDateToSqlFormat = date => date
    .toISOString().slice(0, 19).replace("T", " ");

export const getUtcUnixTimeNow = () => {
    const now = new Date();
    const nowUtc = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    const nowUtcUnix = nowUtc.getTime() / 1000;

    return nowUtcUnix;
};

export const checkUserName = (username: string): IAPIError | undefined => {
    const pattern = new RegExp(/[~`!#@$%\^&*+=. \-\[\]\\';,/{}|\\":<>\?]/); // unacceptable chars

    if (!username) {
        return {
            code: "WRONG_USERNAME",
            desc: "Username is required.",
            httpCode: 400
        };
    }

    if (pattern.test(username)) {
      return {
        code: "WRONG_USERNAME",
        desc: "Username: please only use standard alphanumerics",
        httpCode: 400
      };
    }

    if (username.length < 3) {
      return {
        code: "WRONG_USERNAME",
        desc: "Username should be at least 3 characters.",
        httpCode: 400
      };
    }

    if (username.length > 16) {
      return {
        code: "WRONG_USERNAME",
        desc: "Username cannot have more than 16 characters",
        httpCode: 400
      };
    }

    return;
  };
