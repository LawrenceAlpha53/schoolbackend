const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PaymentUser } = require("../models");


const register = async(data)=>{

    const exists = await PaymentUser.findOne({
        where:{
            email:data.email
        }
    });

    if(exists){
        throw new Error("Email already exists");
    }


    const passwordHash = await bcrypt.hash(
        data.password,
        10
    );


    const user = await PaymentUser.create({

        fullName:data.fullName,
        email:data.email,
        phone:data.phone,
        password:passwordHash

    });


    return user;

};



const login = async(email,password)=>{


    const user = await PaymentUser.findOne({
        where:{
            email
        }
    });


    if(!user){
        throw new Error("Invalid email or password");
    }


    const check = await bcrypt.compare(
        password,
        user.password
    );


    if(!check){
        throw new Error("Invalid email or password");
    }



    const token = jwt.sign(
        {
            id:user.id,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
        }
    );


    return {
        user,
        token
    };

};


module.exports={
    register,
    login
};