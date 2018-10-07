define({ "api": [  {    "type": "get",    "url": "http://github.com/vq-marketplace-platform",    "title": "VQ Marketplace Platform",    "version": "0.0.2",    "group": "Introduction",    "description": "<p>The VQ Marketplace Platform is used for building and running two-sided marketplaces. It supports multitenancy. Some of the modules include users, listings, listing requests, orders (transactions), reviews and reporting. The platform follows RESTful standards of data exchange to allow easy and fast integration with third-party providers.</p>",    "filename": "src/app.ts",    "groupTitle": "Introduction",    "name": "GetHttpGithubComVqMarketplacePlatform"  },  {    "type": "put",    "url": "/api/upload/file",    "title": "Uploads file",    "version": "0.0.2",    "name": "UploadFile",    "group": "Upload",    "permission": [      {        "name": "user"      }    ],    "description": "<p>API endpoint for uploading documents. Documents can be in the following formats: pdf, png and jpeg. Upload is limited to 5MB.</p>",    "examples": [      {        "title": "JS",        "content": "const formData = new FormData();\n\nconst inputField = document.querySelector(\"input[type='file']\");\n\nformData.append(\"file\", inputField.file);\n\nfetch('/api/upload/file', {\n    method: 'POST',\n    body: formData,\n    headers: {\n        \"x-auth-token\": \"YOUR_TOKEN\"\n    }\n})\n.then(response => response.json())\n.then(response => console.log('Success:', JSON.stringify(response)))\n.catch(error => console.error('Error:', error));",        "type": "js"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "string",            "optional": false,            "field": "url",            "description": "<p>Name of the file</p>"          }        ]      },      "examples": [        {          "title": "Success-Response",          "content": "{  url: \"b28xxuf91eduelo4gnb3hsdb61ufza4z.pdf\" }",          "type": "json"        }      ]    },    "filename": "src/app/routes/upload.ts",    "groupTitle": "Upload"  },  {    "type": "get",    "url": "/api/signup/email",    "title": "Signup",    "version": "0.0.2",    "group": "User",    "description": "<p>API endpoint for signup of new users with e-mail. It supports JWT authentification. In the response you will get a token, that you can then include in subsequent requests in the &quot;x-auth-token&quot;.</p>",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>Users unique email.</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "password",            "description": "<p>User password</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "repeatPassword",            "description": "<p>Repeated user password for verification</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "firstName",            "description": "<p>First name of the User.</p>"          },          {            "group": "Parameter",            "type": "String",            "allowedValues": [              "\"0\"",              "\"1\"",              "\"2\""            ],            "optional": false,            "field": "userType",            "description": "<p>User type (any, customer, supplier).</p>"          },          {            "group": "Parameter",            "type": "Object",            "optional": false,            "field": "props",            "description": "<p>User properties, fully extensible, [key: string]: string</p>"          }        ]      }    },    "examples": [      {        "title": "Example request",        "content": "fetch('/api/signup/email', {\n\tmethod: 'POST',\n\tbody: {\n\t\temail: \"info@vq-labs.com\",\n\t\tpassword: \"test\",\n\t\tfirstName: \"Max\",\n\t\tlastName: \"Mustermann\",\n\t\tuserType: 1, // 1 stands for demand users, 2 for supply users\n\t\tprops: { // any property can be added to user\n\t\t\tpropOne: \"one\",\n\t\t\tpropTwo: \"two\"\n\t\t}\n\t}\n})\n.then(response => response.json())\n.then(response => console.log('Success:', JSON.stringify(response)))\n.catch(error => console.error('Error:', error));",        "type": "js"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "number",            "optional": false,            "field": "id",            "description": "<p>Account ID (is not the same as the ID of the user!)</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "token",            "description": "<p>Authentification token can be saved for next requests</p>"          },          {            "group": "Success 200",            "type": "User",            "optional": false,            "field": "user",            "description": "<p>User object</p>"          }        ]      },      "examples": [        {          "title": "Success-Response",          "content": "{\n\t // Save this token and include it in the header \"x-auth-token\" in the subsequent requests.\n\t token: \"X-AUTH_TOKEN\",\n\t user: {\n\t\tid: 16\n\t\tuserType: 2,\n\t\tstatus: \"0\",\n\t\taccountType: \"PRIVATE\"\n\t\tavgReviewRate: 3\n\t\tbillingAddresses: []\n\t\tbio: null\n\t\tcountry: null\n\t\tcreatedAt: \"2018-10-07T18:41:05.000Z\"\n\t\tdeletedAt: null\n\t\tfirstName: \"Max\"\n\t\tlastName: \"Mustermann\"\n\t\timageUrl: null\n\t\tisAdmin: false\n\t\treviews: []\n\t\tupdatedAt: \"2018-10-07T18:41:05.000Z\"\n\t\tuserPreferences: []\n\t\tuserProperties: [\n\t\t\t{ id: 69, propKey: \"companyName\", propValue: \"VQ\", createdAt: \"2018-10-07T18:41:05.000Z\", updatedAt: \"2018-10-07T18:41:05.000Z\" }\n\t\t\t{ id: 71, propKey: \"phoneNo\", propValue: \"123123\", createdAt: \"2018-10-07T18:41:05.000Z\", updatedAt: \"2018-10-07T18:41:05.000Z\" }\n\t\t\t{ id: 73, propKey: \"termsOfSeriviceAccepted\", propValue: \"1\", createdAt: \"2018-10-07T18:41:05.000Z\", updatedAt: \"2018-10-07T18:41:05.000Z\" }\n\t\t\t{ id: 75, propKey: \"privacyPolicyAccepted\", propValue: \"1\", createdAt: \"2018-10-07T18:41:05.000Z\", updatedAt: \"2018-10-07T18:41:05.000Z\" }\n\t\t],\n\t\tvqUserId: 33,\n\t\t// authentification object:\n\t\tvqUser: {\n\t\t\tcreatedAt: \"2018-10-07T18:41:04.000Z\"\n\t\t\tid: 33\n\t\t\tstatus: 0\n\t\t\tupdatedAt: \"2018-10-07T18:41:04.000Z\"\n\t\t}\n\t\twebsite: null\n\t}",          "type": "json"        }      ]    },    "filename": "src/app/routes/policy.ts",    "groupTitle": "User",    "name": "GetApiSignupEmail"  },  {    "type": "put",    "url": "/api/user/:userId",    "title": "Updates user data",    "version": "0.0.2",    "group": "User",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>Users unique email.</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "firstName",            "description": "<p>First name of the User.</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "lastName",            "description": "<p>Last name of the User.</p>"          },          {            "group": "Parameter",            "type": "String",            "allowedValues": [              "\"0\"",              "\"1\"",              "\"2\""            ],            "optional": false,            "field": "userType",            "description": "<p>User type (any, customer, supplier).</p>"          },          {            "group": "Parameter",            "type": "Object",            "optional": false,            "field": "props",            "description": "<p>User properties, fully extensible, [key: string]: string</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "id",            "optional": false,            "field": "id",            "description": "<p>user ID (is not the same as the account ID of the user)</p>"          }        ]      }    },    "filename": "src/app/routes/user.ts",    "groupTitle": "User",    "name": "PutApiUserUserid"  },  {    "type": "get",    "url": "http://github.com/vq-marketplace-platform/LICENCE",    "title": "Licence",    "version": "0.0.2",    "group": "_Licence",    "description": "<p>MIT License Copyright (c) 2017 ViciQloud UG (haftungsbeschränkt)</p> <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p> <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p> <p>THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>",    "filename": "src/app.ts",    "groupTitle": "_Licence",    "name": "GetHttpGithubComVqMarketplacePlatformLicence"  }] });
