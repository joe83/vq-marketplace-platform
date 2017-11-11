const path = require('path');
const fs = require('graceful-fs');

const defaultValuesForReplace = {
    companyName: "VQ-Labs",
    address: "Robert-Bosch-Strasse 49\n" +
    "69190 Walldorf\n" +
    "GERMANY",
    telephone: "info@vq-labs.com",
    website: "vq-labs.com"
};

const replaceDefaultValues = (html) => {
    Object.keys(defaultValuesForReplace).forEach(function(key) {
        html = html.replace(new RegExp("#" + key + "#", "g"), defaultValuesForReplace[key]);
    });

    return html;
};

const generateSingleColumnEmail = (heading, title, body, cb) => {
    fs.readFile(path.join(__dirname,'../emailTemplates/singleColumn.html'), 'utf8', (err, html) => {

        var headingRegExp = new RegExp("#heading#", "g");
        var titleRegExp = new RegExp("#title#", "g");
        var bodyRegExp = new RegExp("#body#", "g");

        html = replaceDefaultValues(html);
        html = html.replace(headingRegExp, heading);
        html = html.replace(titleRegExp, title);
        html = html.replace(bodyRegExp, body);

        return cb(html);
    });
};

const generateDoubleColumnEmail = (heading, title, bodyLeft, bodyRight, cb) => {
    fs.readFile(path.join(__dirname,'../emailTemplates/doubleColumn.html'), 'utf8', (err, html) => {

        var headingRegExp = new RegExp("#heading#", "g");
        var titleRegExp = new RegExp("#title#", "g");
        var bodyLeftRegExp = new RegExp("#bodyLeft#", "g");
        var bodyRightRegExp = new RegExp("#bodyRight#", "g");

        html = replaceDefaultValues(html);
        html = html.replace(headingRegExp, heading);
        html = html.replace(titleRegExp, title);
        html = html.replace(bodyLeftRegExp, bodyLeft);
        html = html.replace(bodyRightRegExp, bodyRight);

        return cb(html);
    });
};

const generateTriplePanelTopEmail = (heading, title, bodyTop, bodyLeft, bodyRight, cb) => {
    fs.readFile(path.join(__dirname,'../emailTemplates/triplePanelTop.html'), 'utf8', (err, html) => {

        var headingRegExp = new RegExp("#heading#", "g");
        var titleRegExp = new RegExp("#title#", "g");
        var bodyTopRegExp = new RegExp("#bodyTop#", "g");
        var bodyLeftRegExp = new RegExp("#bodyLeft#", "g");
        var bodyRightRegExp = new RegExp("#bodyRight#", "g");

        html = replaceDefaultValues(html);
        html = html.replace(headingRegExp, heading);
        html = html.replace(titleRegExp, title);
        html = html.replace(bodyTopRegExp, bodyTop);
        html = html.replace(bodyLeftRegExp, bodyLeft);
        html = html.replace(bodyRightRegExp, bodyRight);

        return cb(html);
    });
};

const generateTriplePanelBottomEmail = (heading, title, bodyLeft, bodyRight, bodyBottom, cb) => {
    fs.readFile(path.join(__dirname,'../emailTemplates/triplePanelBottom.html'), 'utf8', (err, html) => {

        var headingRegExp = new RegExp("#heading#", "g");
        var titleRegExp = new RegExp("#title#", "g");
        var bodyLeftRegExp = new RegExp("#bodyLeft#", "g");
        var bodyRightRegExp = new RegExp("#bodyRight#", "g");
        var bodyBottomRegExp = new RegExp("#bodyBottom#", "g");

        html = replaceDefaultValues(html);
        html = html.replace(headingRegExp, heading);
        html = html.replace(titleRegExp, title);
        html = html.replace(bodyLeftRegExp, bodyLeft);
        html = html.replace(bodyRightRegExp, bodyRight);
        html = html.replace(bodyBottomRegExp, bodyBottom);

        return cb(html);
    });
};

const generateFourPanelEmail = (heading, title, bodyBottom, bodyLeft, bodyRight, cb) => {
    fs.readFile(path.join(__dirname,'../emailTemplates/fourPanel.html'), 'utf8', (err, html) => {

        var headingRegExp = new RegExp("#heading#", "g");
        var titleRegExp = new RegExp("#title#", "g");
        var bodyTopRegExp = new RegExp("#bodyTop#", "g");
        var bodyLeftRegExp = new RegExp("#bodyLeft#", "g");
        var bodyRightRegExp = new RegExp("#bodyRight#", "g");
        var bodyBottomRegExp = new RegExp("#bodyBottom#", "g");

        html = replaceDefaultValues(html);
        html = html.replace(headingRegExp, heading);
        html = html.replace(titleRegExp, title);
        html = html.replace(bodyTopRegExp, bodyTop);
        html = html.replace(bodyLeftRegExp, bodyLeft);
        html = html.replace(bodyRightRegExp, bodyRight);
        html = html.replace(bodyBottomRegExp, bodyBottom);

        return cb(html);
    });
};

module.exports = {
    generateSingleColumnEmail,
    generateDoubleColumnEmail,
    generateTriplePanelTopEmail,
    generateTriplePanelBottomEmail,
    generateFourPanelEmail
};
