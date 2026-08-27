const express=require("express");

const router=express.Router();

const PaymentController=
require("../UserControllers/PaymentController");


router.post(
"/register",
PaymentController.register
);


router.post(
"/login",
PaymentController.login
);


module.exports=router;