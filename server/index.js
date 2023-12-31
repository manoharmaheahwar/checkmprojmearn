const express=require('express')
require('./db/Config')
const cors=require('cors');  
const User=require('./db/User')
const Product=require('./db/Product');
const Jwt=require('jsonwebtoken');

const jwtKey='e-comm';
const app=express();

app.use(express.json())
app.use(cors());

app.post("/register",async (req,resp)=>{
    let user=new User(req.body);
    let result=await user.save();
    result=result.toObject();
    delete result.password;
    if (user) {
        Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err,token)=>{
            if(err){
                resp.send("Something went wrong please try again")  
            }
            resp.send({user,auth:token})
        })
    }
})

app.post("/login",async (req,resp)=>{
    
    if(req.body.email && req.body.password){
        let user= await User.findOne(req.body).select("-password");

        if (user) {
            Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err,token)=>{
                if(err){
                    resp.send("Something went wrong")  
                }
                resp.send({user,auth:token})
            })
        }
        else{
            resp.send({result:"please enter username and password correct"});
        }
    }else{
        resp.send({result:"username and password mandatory"});
    }
})

app.post('/add-product',verifytoken,async (req,resp)=>{
    let product=new Product(req.body)
    let result=await product.save();
    resp.send(result);
})

app.get("/products",verifytoken,async(req,resp)=>{
    let product=await Product.find()
    if(product.length>0){
        resp.send(product)
    }
    else{
        resp.send({result:"No products"})
    }
})

app.delete("/product/:id",verifytoken,async(req,resp)=>{
    const result=await Product.deleteOne({_id:req.params.id})
    resp.send(result)
})

app.get("/product/:id",verifytoken,async (req,resp)=>{
    let result=await Product.findOne({_id:req.params.id});
    if(result){
        resp.send(result)
    }else{
        resp.send({result:"No record found"})
    }
})

app.put("/product/:id",verifytoken,async(req,resp)=>{
    let result=await Product.updateOne(
        {_id:req.params.id},
        {
            $set:req.body
        }
    )
    resp.send(result);
})

app.get("/search/:key",verifytoken,async (req,resp)=>{
    let result=await Product.find({
        
        "$or":[
            {name:{$regex:req.params.key}},
            {company:{$regex:req.params.key}},
            {category:{$regex:req.params.key}},
            {price:{$regex:req.params.key}}
        ]
    })
    resp.send(result)
})

function verifytoken(req,resp,next){
    let token=req.headers['authorization'];
    if(token){
        token=token.split(' ')[1];
        console.log("middleware called",token);
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({result:"Please provide valid token"})
            }
            else{
                next();
            }
        })
    }
    else{
        resp.status(403).send({result:"Please add token with header"})
    }
}

app.listen(5000)