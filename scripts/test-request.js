const async = require("async");
const request = require("request");

request.post({
    url: "https://taskbee.vqmarketplace.com/api/admin/subscription-portal",
    headers: {
        "x-auth-token": "9bsqe9mqeryci47zq8b2rz89e5oalt39k2wobwexvfn2kzui9eg1frsooeopvbxufrx067y3nsz4tfvhvjom1c2fwp5zs7lfyn3k2ggynm4alkoiocqmg57gff5p5m4y8gf9ui5197r299wqzwwypvl96mpwwwcypwkml5hfodqonz5qr1kl0tob4mk457gzojcki749of57fq8eeo0nivlllqm2diftzvmhfsehsds1cphj3qgcz32566"
    }
}, (err, res, body) => {
    console.log(err, body);

    process.exit();
});
