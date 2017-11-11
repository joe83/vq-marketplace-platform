var checkIfEmailVerified = require("../app/controllers/userController.js").checkIfEmailVerified;
var responseController = require("../app/controllers/responseController.js");
var cust = require("../app/config/customizing.js");


var isEmailVerified = function(req,res,next){
  
  if(!req.user){
    return next();
  }
  
  checkIfEmailVerified(req.user.id,function(err,result){
    if(err){
      return responseController.sendResponse(res,err);
    }
    
    console.log(result);
    
    if(result.isVerified){
      return next();
    }
    
    return responseController.sendResponse(res,responseController.generateError(cust.errorCodes.EMAIL_NOT_VERIFIED.code));
  });
};

module.exports = {
  isEmailVerified : isEmailVerified
};