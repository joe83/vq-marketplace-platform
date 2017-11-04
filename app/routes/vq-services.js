var NodeGeocoder = require("node-geocoder");
var options = {
 provider: "google",
 // Optional depending on the providers
 httpAdapter: "http", // Default
 // apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
 // formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

module.exports = app => {
    app.post("/api/vq-services/address-validation", (req, res) => {
        const addressBody = req.body;
        
        const addressString = `${addressBody.street}, ${addressBody.city}, ${addressBody.countryCode}`;

        geocoder.geocode(addressString, (err, data) => {
            if (err) {
                res.status(400).send(err);
            }

            return res.send(data);
        });
    });
};
