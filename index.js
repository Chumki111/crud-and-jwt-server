const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const cookie = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleWare
app.use(cors({
  origin :['http://localhost:5173'],
  credentials:true
}));
app.use(express.json())
app.use(cookie())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dnejwhv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const logger = async(req,res,next) =>{
  console.log('called:',req.host,req.originalUrl);
  next();
}
const verifyToken = async(req,res,next) =>{
  const token = req.cookies.token;
  console.log('value of token in middleware',token);
 if(!token) {
  return res.status(401).send({message : 'not authorize'})
 }
 jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
  if(err){
    console.log(err);
    return res.status(401).send({message : 'unauthorize'})
  }
  console.log('value in the token',decoded);
   req.user = decoded;
   next();
 })
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const PopularServiceCollection = client.db('servicesDB').collection('popularServices');
    const servicesCollection = client.db('servicesDB').collection('services');
    const bookingCollection = client.db('servicesDB').collection('bookings');
    const addServicesCollection = client.db('servicesDB').collection('addServices');
     
    app.post('/jwt',logger,async(req,res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn : '1h'})
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false,
        // sameSite :'none'
      })
      .send({success:true})
    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })
    app.get('/popularServices',async(req,res) =>{
      const cursor = PopularServiceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })
    app.get('/popularServices/:id',async(req,res) =>{
      const id =req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await PopularServiceCollection.findOne(query);
      res.send(result)
    })
    app.get('/services',async(req,res) =>{
      const cursor = servicesCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })
    app.get('/services/:id',async(req,res) =>{
      const id =req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await servicesCollection.findOne(query);
      res.send(result)
    })
    app.patch('/bookings/:id',async(req,res) =>{
      const id =req.params.id;
      const query = {_id:new ObjectId(id)};
      const updatedBooking = req.body;
      const updateDoc =  {
        $set :{
          status : updatedBooking.status
        }
      }
      const result = await bookingCollection.updateOne(query,updateDoc);
      res.send(result)
    })

    app.post('/bookings',logger,verifyToken,async(req,res) =>{
      const order = req.body;
     
      const result = await bookingCollection.insertOne(order);
      res.send(result)
     })
     app.get('/bookings',async(req,res) =>{
      console.log('user in the valid token',req.user);
      if(req.query.email !== req.user.email){
        return res.status(403).send({message:'forbidden access'})
      }
      console.log(req.query?.email);

     let query = {};
              if (req.query?.email) {
                  query = { userEmail: req.query.email }
              }
              const result = await bookingCollection.find(query).toArray();
              res.send(result);
  });
    app.post('/addServices',async(req,res) =>{
      const order = req.body;
     const result = await addServicesCollection.insertOne(order);
      res.send(result)
     })

     app.get('/addServices',async(req,res) =>{
      // console.log('tok tok token',req.cookies.token);
      // console.log('user in the valid token',req.user);
      // if(req.query.email !== req.user.email){
      //   return res.status(403).send({message:'forbidden access'})
      // }
      console.log(req.query?.email);

     let query = {};
              if (req.query?.email) {
                  query = { userEmail: req.query.email }
              }
              const result = await addServicesCollection.find(query).toArray();
              res.send(result);
  });

  app.delete('/addServices/:id',async(req,res) =>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    
    const result = await addServicesCollection.deleteOne(query)
    res.send(result)
  })
  app.get('/addServices/:id',async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await addServicesCollection.findOne(query);
    res.send(result)
   })
  app.put('/addServices/:id',async(req,res) =>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const options ={upsert :true};
    const updatedService = req.body;
    const service ={
      $set : {
        serviceName :updatedService.serviceName,
        date:updatedService.date,
       
        userName:updatedService.userName,
        userEmail:updatedService.userEmail,
        customerMessage : updatedService.customerMessage,
        Price:updatedService.Price,
        photo:updatedService.photo,
        serviceLocation:updatedService.serviceLocation
      }
    }
    const result = await addServicesCollection.updateOne(filter,service,options);
    res.send(result)

  })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) =>{
   res.send('Services is running')
})

app.listen(port,() =>{
    console.log(`offline service sharing is running on port : ${port}`);
})