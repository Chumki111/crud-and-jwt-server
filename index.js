const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dnejwhv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const PopularServiceCollection = client.db('servicesDB').collection('popularServices');
    const servicesCollection = client.db('servicesDB').collection('services');
    const bookingCollection = client.db('servicesDB').collection('bookings');
    const addServicesCollection = client.db('servicesDB').collection('addServices');

    app.get('/popularServices',async(req,res) =>{
      const cursor = PopularServiceCollection.find();
        const result = await cursor.toArray();
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

    app.post('/bookings',async(req,res) =>{
      const order = req.body;
     
      const result = await bookingCollection.insertOne(order);
      res.send(result)
     })
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
     let query = {};
              if (req.query?.email) {
                  query = { UserEmail: req.query.email }
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