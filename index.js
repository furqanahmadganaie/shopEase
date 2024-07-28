

const express=require("express");
// create app instance
const app=express();
// import mongoose
const mongoose=require("mongoose");

require('dotenv').config()

const port= process.env.PORT
const connection = mongoose.connect(process.env.MONGO_URL)

module.exports ={connection}

//initialixe jsonwebtoten gen token and verify 
const jwt=require("jsonwebtoken");
// using multer we can create image storage sydtem
const multer=require("multer");
//include path from express server using path we can get acess to our backend directory in our express app

const path=require("path");
const fs = require('fs');
//cors provide acess to react project
const cors=require("cors"); //the above were dependencies 
const { type } = require("os");



app.use(express.json());//what ever request we get from resposce that will be automaticlly pased through json
app.use(cors());// using this our react project wiil be connected to express at port 4000


//initialize data base

mongoose.connect("mongodb+srv://furqanahmad:Furqan%40sumii1464%231909@cluster0.fxvppv4.mongodb.net/e-commerce")
   .then(() => {
     console.log('Connected to MongoDB Atlas');
   })
   .catch((err) => {
     console.error('Error connecting to MongoDB Atlas:', err.message);
  });





//API creation

app.get("/",(req,res)=>{
  res.send("express app is running")  
})


// Ensure the upload/images directory exists
const uploadDir = path.join(__dirname, 'upload/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// in order to store the upload images  in backend folder we 
// have to create a folder(upload )which will store them 

//image storage system
//generate filename we create a arrow func

const storage=multer.diskStorage({
  destination:'./upload/images',
  filename:(req,file,cb)=>{
    return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});


//using multer we will create upload funct we will pass this confugration
const upload=multer({storage:storage});


app.use('/images',express.static('upload/images'));//this is middleware serving for static files
//createing upload endpoit for images


 app.post("/upload",upload.single('product'),(req,res)=>{
       
  try {
    // Check if req.file exists
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Log the filename
    console.log('Uploaded filename:', req.file.filename);

    // Send response with success and image URL
    res.json({
      success: 1,
      image_url: `http://localhost:${port}/images/${req.file.filename}`
    });

  } catch (err) {
    // Handle any errors
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }

 
 });

 //thunder client is extension which used to test the network request

 //go thuder apply api adress and open body choose file and field name (product )
 //and send we will fet image uploaded in images folder 
 
 
 //schema for creating products 
 //product name of schema 
 const Product= mongoose.model("Product",{
  id:{
    type:Number,
    required:true,
  },
  name:{
    type:String,
    required:true,
  },
  image:{
    type:String,
    required:true,
  },
  category:{
    type:String,
    required:true,
  },
  new_price:{
    type:Number,
    required:true,
  },
  old_price:{
    type:Number,
    required:true,
  },
  date:{
    type:Date,
    default:Date.now,
  },
  available:{
    type:Boolean,
    default:true,
  },

 })


 //use this schema toadd product in our data base
 //ourproduct willbe create  value will coming from req that we will send using the thunder
app.post('/addproduct',async (req,res)=>{

   //we dont have to provide id so make logic
   let products= await Product.find({})
   let id;
   if(products.length>0)
   {
    let last_product_array =products.slice(-1);
    //as we have only for now 
    let last_product=last_product_array[0];
    id=last_product.id+1;
   }
   else {
    id=1;
   }

  const product= new Product({
    //id will automatically generated
    id:id,
    name:req.body.name,
    image:req.body.image,
    category:req.body.category,
    new_price:req.body.new_price,
    old_price:req.body.old_price
  });
  //display prod
  console.log(product);
  await product.save();
  console.log("product saved")
  //save prod in db

  //to genrate response for frontend 
  res.json({
    success:true,
    name:req.body.name,


  })

})


//create endpoint remove product from database
//we method find one nad delete
app.post('/removeproduct',async(req,res)=>{
  await Product.findOneAndDelete({id:req.body.id});
  console.log("removed");
  res.json({
    success:true,
    name:req.body.name
  })
})




//   createing api getting all product    now we will create another endpoint by which we will get all the products available
//in the data base  using that we can display product in our fronted

app.get('/allproducts',async(req,res)=>{
  //create array to store all products
  let products= await Product.find({});
  console.log("all products fetched");
  //this res for fronted
  res.send(products);
})



//apis
//schema creating for our user model
const Users= mongoose.model('users',{
  name:{
    type:String,
  },
  email:{
    type:String,
    unique:true,
  },
  password:{
    type:String,
  },

  cartData:{
    type:Object,
  },
  date:{
    type:Date,
    default:Date.now,
  }
})

//create endpoint for registering user
app.post('/signup',async(req,res)=>{
 //the details all ready exists or not

let check =await Users.findOne({email:req.body.email});

if(check)
{
  return res.status(400).json({success:false,errors:"existing user found with same emails address"})
}
//create empty cart if user is not alredy exists


let cart={};
for(let i=0; i< 300;i++)
{
cart[i]=0;
}

const user=new Users({
  name:req.body.username,
  email:req.body.email,
  password:req.body.password,
  cartData:cart,

})
//save the user in db
await user.save();
//jwt authentication

const data={
  user:{
    id:user.id
  }
}

//crete token
const token=jwt.sign(data,'secret_ecom');
res.json({success:true,token})


})


//creting endpoint for user login

app.post('/login',async(req,res)=>{
  let user= await Users.findOne({email:req.body.email});

  if(user)
  {
    //compare psw
    const passwordCompare=req.body.password=== user.password;
    if(passwordCompare)
    {
      const data={
        user:{
          id:user.id
        }
      }


      const token=jwt.sign(data,'secret_ecom');//salt gen token
      res.json({success:true,token});
    }

    else{
      res.json({success:false,errors:"wrong Password"})
    }


  }
  
  else{
    res.json({success:false,errors:"Wrong Email Id"})
  }


})


//creating endpoint for new collection data 
app.get('/newcollections',async(req,res)=>{
  //save all products in db 
  let products = await Product.find({});
  let newcollection= products.slice(1).slice(-8);
  console.log("NewCollections Fetched")
  res.send(newcollection);

})

//creaing endpoints for popular in women section 
app.get('/popularinwomen',async(req,res)=>{
 let products =await Product.find({category:"women"});
 let popular_in_women=products.slice(0,4);
 console.log("popular in women fetched")
 res.send(popular_in_women);

})

// creating middleware to fetch user

const fetchUser=async(req,res,next)=>{
   const token= req.header('auth-token');
   if(!token){
    res.status(401).send({errors:"please authenticate using valid token"})
   }

   else{
    try{
      const data=jwt.verify(token,'secret_ecom');
      req.user=data.user;
      next();
    } catch(error) {
          res.status(401).send({errors:"please authenticate using valid token"})
    }
   }

}
//create enpoints for adding product  in cart data 
//use middleware here 

app.post('/addtocart',fetchUser,async(req,res)=>{
  console.log("addeded",req.body.itemId);
   let userData=await Users.findOne({_id:req.user.id});
   userData.cartData[req.body.itemId] +=1;
   await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})

   res.send("added");
})


//creating endpoint to remove product from cart data 

app.post('/removefromcart',fetchUser,async(req,res)=>{
  console.log("removed",req.body.itemId);
  let userData=await Users.findOne({_id:req.user.id});

  if(  userData.cartData[req.body.itemId]>0)
  userData.cartData[req.body.itemId] -=1;

  await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})

  res.send("removed");
})


//creating endpoint get cart data and link this api with front end
app.post('/getcart',fetchUser,async(req,res)=>{
  console.log("GetCart");
  let userData=await Users.findOne({_id:req.user.id});
  res.json(userData.cartData);


})



 app.listen(port,(error)=>{
  if(!error){
   console.log("Server running on port "+port)
  }
  else {
   console.log("error : "+error)
  }
})