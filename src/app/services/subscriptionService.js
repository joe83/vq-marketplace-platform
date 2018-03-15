const chargebee = require("chargebee");
const async = require("async");

chargebee.configure({
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY 
});

const createCustomer = (tenantRef, cb) => {
  chargebee
  .customer
  .create({
    first_name : tenantRef.firstName, 
    last_name : tenantRef.lastName, 
    email : tenantRef.email, 
    locale : "en-GB",
    meta_data: {
      tenantId: tenantRef.tenantId,
      marketplaceUrl: `https://${tenantRef.tenantId}.vqmarketplace.com`,
      marketplaceType: tenantRef.marketplaceType,
      country: tenantRef.country
    }
  })
  .request((err, result) => {
    if (err) {
      //handle error
      console.log(err);

      return cb(err);
    }

    tenantRef.chargebeeCustomerId = result.customer.id;

    tenantRef
    .save()
    .then(() => cb && cb(undefined, tenantRef))
    .catch(err => cb && cb(err, tenantRef));
  });
};

const listPlans = cb => {
  const plans = [];

  chargebee.plan.list({
    "limit": 5, 
    "status": "active"
  }).request((error,result) => {
    if(error){
      //handle error
      console.log(error);

      cb(error);
    } else {
      for (var i = 0; i < result.list.length;i++) {
        
        var entry=result.list[i];

        plans.push(entry.plan);
      }

      cb(undefined, plans);
    }
  });
};

const chargebeeNewSubCheckout = (subId, tenantRef, cb) => {
  chargebee.hosted_page.checkout_new({
      subscription : {
        plan_id: subId
      }, 
      customer : {
        email : tenantRef.email, 
        first_name : tenantRef.firstName, 
        last_name : tenantRef.lastName,
        locale : "en"
      }
    })
    .request(function(error,result){
      if(error){
        //handle error
        console.log(error);

        cb(error);
      }else{
        console.log(result);
        var hosted_page = result.hosted_page;

        cb(undefined, hosted_page);
      }
    });
};

const chargebeeCustomerPortalSignIn = (tenantRef, cb) => {
  async.waterfall([
    cb => {
      if (tenantRef.chargebeeCustomerId) {
        
    
        return cb();
      }

      createCustomer(tenantRef, (err, newTenantRef) => {
        if (err) {
          cb(err);

          return;
        }

        tenantRef = newTenantRef;

        cb();
      });
    },
    cb => {
      chargebee
      .portal_session
      .create({
        redirect_url: `https://${tenantRef.tenantId}.vqmarketplace.com`,
        customer: {
          id: tenantRef.chargebeeCustomerId
        }
      })
      .request((err, result) => {
        if (err) {
          //handle error
          console.log(err);

          return cb(err);
        }

        console.log(result);

        cb(undefined, result);
      });
    }
  ], cb);

  

  

  /**
    chargebee.subscription.create({
        plan_id : "full-ps4-vr", 
        customer : {
          email : "john@user.com", 
          first_name : "John", 
          last_name : "Doe", 
          locale : "en-GB", 
          phone : "+1-949-999-9999"
        }, 
        billing_address : {
          first_name : "John", 
          last_name : "Doe", 
          line1 : "PO Box 9999", 
          city : "Walnut", 
          state : "California", 
          zip : "91789", 
          country : "US"
        }
      }).request(function(error,result){
        if(error){
          //handle error
          console.log(error);
        }else{
          console.log(result);
          var subscription = result.subscription;
          var customer = result.customer;
          var card = result.card;
          var invoice = result.invoice;
          var unbilled_charge = result.unbilled_charge;
        }

        cb(error, result);
      });
      */
};

/**
 * Creates customer entity in external CRM and Billing Services for tenant and saves the reference.
 */
const ensureCustomerDataSaved = (tenantRef, cb) => {
  console.log("Creating Chargebee Customer");

  async.waterfall([
    cb => {
      chargebee.customer.create({
        first_name : tenantRef.firstName, 
        last_name : tenantRef.lastName, 
        email : tenantRef.email, 
        locale : "en-GB",
        meta_data: {
          tenantId: tenantRef.tenantId,
          marketplaceUrl: `https://${tenantRef.tenantId}.vqmarketplace.com`,
          marketplaceType: tenantRef.marketplaceType,
          country: tenantRef.country
        }
      })
      .request((err, result) => {
        if (err) {
          cb(err);
    
          return;
        }

        tenantRef.chargebeeCustomerId = result.customer.id;

        cb();

        return;
      });
    },
    cb => {
      tenantRef
      .save()
      .then(() => cb())
      .catch(cb);
    },
    cb => {
      chargebee
        .subscription
        .create_for_customer(tenantRef.chargebeeCustomerId, {
          plan_id : "starter"
        })
        .request((err,result) => {
          if (err) {
            console.log(err);

            cb(err);

            return;
          }

          tenantRef.chargebeeActiveSubscriptionId = result.subscription.id;

          cb();

          return;
        });
    },
    cb => {
      tenantRef
      .save()
      .then(() => cb())
      .catch(cb);
    }
  ], err => {
    if (cb) {
      cb(err, tenantRef);
    }
  });
};

const createSubscription = (data, cb) => {
  chargebee.customer.create({
    /**
    first_name : data.firstName, 
    last_name : data.lastName, 
    email : data.email, 
    locale : "en-GB",
    billing_address: {
      first_name : "John", 
      last_name : "Doe", 
      line1 : "PO Box 9999", 
      city : "Walnut", 
      state : "California", 
      zip : "91789", 
      country : "US"
    }
    */
  }).request(function(error,result){
    if(error){
      //handle error
      console.log(error);
    }else{
      console.log(result);
      var customer = result.customer;
      var card = result.card;
    }
  });

  /**
    chargebee.subscription.create({
        plan_id : "full-ps4-vr", 
        customer : {
          email : "john@user.com", 
          first_name : "John", 
          last_name : "Doe", 
          locale : "en-GB", 
          phone : "+1-949-999-9999"
        }, 
        billing_address : {
          first_name : "John", 
          last_name : "Doe", 
          line1 : "PO Box 9999", 
          city : "Walnut", 
          state : "California", 
          zip : "91789", 
          country : "US"
        }
      }).request(function(error,result){
        if(error){
          //handle error
          console.log(error);
        }else{
          console.log(result);
          var subscription = result.subscription;
          var customer = result.customer;
          var card = result.card;
          var invoice = result.invoice;
          var unbilled_charge = result.unbilled_charge;
        }

        cb(error, result);
      });
      */
};

const getSubscription = () => {
    chargebee.subscription.create({
        plan_id : "basic", 
        customer : {
          email : "john@user.com", 
          first_name : "John", 
          last_name : "Doe", 
          locale : "fr-CA", 
          phone : "+1-949-999-9999"
        }, 
        billing_address : {
          first_name : "John", 
          last_name : "Doe", 
          line1 : "PO Box 9999", 
          city : "Walnut", 
          state : "California", 
          zip : "91789", 
          country : "US"
        }
      }).request(function(error,result){
        if(error){
          //handle error
          console.log(error);
        }else{
          console.log(result);
          var subscription = result.subscription;
          var customer = result.customer;
          var card = result.card;
          var invoice = result.invoice;
          var unbilled_charge = result.unbilled_charge;
        }
      });
};

module.exports = {
  listPlans,
  chargebeeCustomerPortalSignIn,
  ensureCustomerDataSaved,
  createSubscription,
  getSubscription,
  chargebeeNewSubCheckout
};