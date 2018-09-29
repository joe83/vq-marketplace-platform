define({ "api": [  {    "type": "get",    "url": "/api/signup/email",    "title": "Create new account with e-mail",    "name": "Signup",    "group": "User",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>Users unique email.</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "firstname",            "description": "<p>Firstname of the User.</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "lastname",            "description": "<p>Lastname of the User.</p>"          }        ]      }    },    "version": "0.0.0",    "filename": "src/app/routes/policy.js",    "groupTitle": "User"  }] });
