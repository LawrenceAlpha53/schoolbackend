const PaymentService = require("../UserServices/PaymentService");


const PaymentController={


register:async(req,res)=>{

try{

const user =
await PaymentService.register(req.body);


res.json({
message:"Account created successfully",
user
});


}catch(error){

res.status(400).json({
message:error.message
});

}

},



login:async(req,res)=>{

try{

const result =
await PaymentService.login(
req.body.email,
req.body.password
);


res.json(result);


}catch(error){

res.status(400).json({
message:error.message
});

}

}


};


module.exports=PaymentController;