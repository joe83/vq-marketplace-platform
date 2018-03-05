const chargebee = require("chargebee");
const async = require("async");

const config = require("../config/configProvider")();

chargebee.configure({
    site: config.CHARGEBEE_SITE,
    api_key: config.CHARGEBEE_API_KEY 
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
  .request((error, result) => {
    if(error){
      //handle error
      console.log(error);

      return;
    }

    console.log(result);

    tenantRef.chargebeeCustomerId = result.customer.id;

    tenantRef
    .save()
    .then(() => cb && cb(undefined, tenantRef))
    .catch(() => cb && cb(undefined, tenantRef));
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
  .request((error, result) => {
    if(error){
      //handle error
      console.log(error);

      return;
    }

    console.log(result);

    tenantRef.chargebeeCustomerId = result.customer.id;

    tenantRef
    .save()
    .then(() => cb && cb(undefined, tenantRef))
    .catch(() => cb && cb(undefined, tenantRef));
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
  chargebeeCustomerPortalSignIn,
  ensureCustomerDataSaved,
  createSubscription,
  getSubscription
};