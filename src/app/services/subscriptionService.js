const chargebee = require("chargebee");

chargebee.configure({
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY 
});

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
  ensureCustomerDataSaved,
  createSubscription,
  getSubscription
};