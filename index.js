import { MongoClient } from "mongodb";
import bodyparser from "body-parser";
import cookieparser from "cookie-parser";
// const express = require("express"); // "type": "commonjs"
import express from "express"; // "type": "module"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {auth} from './middlewares/auth.js'
import cors from 'cors'


dotenv.config();
const app = express();
app.use(cors());

app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json())
app.use(cookieparser());


const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

async function hashedPassword(password){
    const salt = 10;
const myPlaintextPassword = password;
return bcrypt.hash(myPlaintextPassword, salt)
}



async function MongoConnect(){
    const client = await new MongoClient(MONGO_URL).connect();
    console.log('Mongo Connected')
    return client;
}

const client = await MongoConnect();


app.get("/", function (request, response) {
  response.send("🙋‍♂️ Welcome to Login/SignUp");
});

app.post("/signup",async function(request,response){
    let {email,password} = request.body;
    let userdb = await client.db('SingIn').collection("Users").findOne({email:email});
    if(userdb){
        response.status(400).send({msg:"user already present",userdb})
    }else{
        const hashedPass = await hashedPassword(password);
        var token = jwt.sign({ email: email }, process.env.JWT_SECRET);
        let result = await client.db('SingIn').collection("Users").insertOne({email:email, password:hashedPass,token:token})
        response.send({msg:"user added", email, result,token})
    }       
})

app.post("/signin",async function(request,response){
    let {email,password} = request.body;
    let userdb = await client.db('SingIn').collection("Users").findOne({email:email});
    const compare = bcrypt.compare(password,userdb.password)
    if(userdb){
        if(compare){            
            response.status(200).send({msg:"logged in",userdb})
        }else{
            response.status(400).send({msg:"invalid credz"})        
        }      
    }else{
        response.status(400).send({msg:"invalid credz"})        
    }       
})

app.get("/profile",auth,async function(request,response){
    const{email} = request.body;
    let userdb = await client.db('SingIn').collection("Users").findOne({email:email});
    request.header("x-auth-token",userdb.token)
    let data = await client.db("SingIn").collection("Profile").findOne({email:email})
    response.send(data);
})


app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));

