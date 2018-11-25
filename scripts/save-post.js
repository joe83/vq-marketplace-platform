const bitcointoken = require("bitcointoken");

const BitcoinWallet = bitcointoken.Wallet
const BitcoinDb = bitcointoken.Db
const BitcoinToken = bitcointoken.Token

const bitcoinWallet = new BitcoinWallet();

const privk = "sdasd";

const db = BitcoinDb.fromHdPrivateKey(privk);

db.put({ a: 'aaa' }).then((id1) => {
    console.log(id1);

    db.get(id1).then( data => {
        console.log(data);
    })
});
