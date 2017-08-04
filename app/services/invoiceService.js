var cust = require("../config/customizing.js");
var fs = require('fs');
var htmlToPdf = require('html-to-pdf');
var ejs = require('ejs');
var async = require('async');
var moment = require('moment');
var UtilService = require("./UtilService");

function renderInvoicePDF (InvoiceDO, params, callback) {
	var options = {
		"format": "A4",
		"orientation": "portrait",
		"border": {
			"top": "10px",
			"right": "1in",
			"bottom": "2in",
			"left": "1in"
		},
		"type": "pdf",
		"quality": "100",
	}
	async.waterfall([
		callback => {
			console.log("[INFO] [INVOICE SERVICE] Creating PDF from HTML file");
			var html = renderInvoiceHTML(InvoiceDO);

			htmlToPdf.convertHTMLString(html, params.file, (error, success) => {
				if (error) {
						console.log('Oh noes! Error!');
						console.log(error);
						callback(err);
				} else {
						console.log('Woot! Success!');
						console.log(success);
						callback();
				}
			});
		}
	], err => callback(err));
}

function renderInvoiceHTML (InvoiceDO) {
    InvoiceDO.setPostingDate(moment.utc());
	InvoiceDO.setFormattedPostingDate(UtilService.formatDate(InvoiceDO.getPostingDate()));
	var ejsInvoiceTemplate = fs.readFileSync(__dirname + '/../templates/invoice_template.ejs', 'utf8');
	
	var html = ejs.render(ejsInvoiceTemplate, { invoice : InvoiceDO });
	console.log(html);
    return html;
};

module.exports = {
    renderInvoiceHTML: renderInvoiceHTML,
	renderInvoicePDF: renderInvoicePDF,
};


