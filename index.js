const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require("dotenv");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
dotenv.config();

// MongoDB connection
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db('AiMODELDAtabase');
    const modelCollection = db.collection('AllMOdels');

    // Get all models find,find
    app.get('/models', async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result);
    });
    app.get("/models/:id", async(req,res)=>{
      const {id }= req.params
      console.log(id)
      const result = await modelCollection.findOne({_id: new ObjectId(id)})
      res.send(result)

    })
// getLetestData for homePage
app.get('/latestModels',async(req,res)=>{
const result = await modelCollection
  .find()
  .sort({ createdAt: -1 }) // Sorts in descending order (newest first)
  .limit(4)                // Limits the result to 4 models
  .toArray();  
  res.send(result)

})


//////Post methiods ("insertOne,insert")

app.post('/models',async(req,res)=>{
  const Data =req.body
  const result =await modelCollection.insertOne(Data)
res.send(result)
})
/////put data for update 
app.put('/models/:id',async(req,res)=>{
  const data = req.body

     const {id }= req.params
   const objectid =new ObjectId(id)
const query = {_id: objectid}
const updateData ={
  $set:data
}

      const result = await modelCollection.updateOne(query,updateData)
      res.send(result)
}
)
// delet api
app.delete('/models/:id',async(req,res)=>{
  const {id} = req.params

  const objectid = new ObjectId(id)
  const  query = {_id: objectid}
const result=await modelCollection.deleteOne(query,)
res.send({
  result
})
})


    // Root route
    app.get('/', (req, res) => {
      res.send('AI Model Inventory API running...');
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);