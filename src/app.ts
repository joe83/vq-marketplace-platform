/**
 * @api {get} http://github.com/vq-marketplace-platform VQ Marketplace Platform
 * @apiVersion 0.0.2
 * @apiGroup Introduction
 * @apiDescription
 *
 * The VQ Marketplace Platform is used for building and running two-sided marketplaces. It supports multitenancy. Some of the modules include users, listings, listing requests, orders (transactions), reviews and
 * reporting. The platform follows RESTful standards of data exchange to allow easy and fast integration with third-party providers.
 * 
 */

 /**
 * @api {get} http://github.com/vq-marketplace-platform/LICENCE Licence
 * @apiVersion 0.0.2
 * @apiGroup *Licence
 * @apiDescription
MIT License
Copyright (c) 2017 ViciQloud UG (haftungsbeschränkt)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

const server = require("./server.js");

server.setupApp();
