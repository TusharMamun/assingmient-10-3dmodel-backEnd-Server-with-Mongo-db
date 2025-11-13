const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const admin = require("firebase-admin");
const serviceAccount = require("./firbase-serviceKey.json");
const dotenv = require("dotenv");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
dotenv.config();







// firebaseService key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// MongoDB connection
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const veryfeyToken = async (req, res, next) => {
  const authoriz = req.headers.authorization;

  if (!authoriz) return res.status(401).send({ message: "Unauthorized Access" });

  const token = authoriz.split(' ')[1]; // single space

  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).send({ message: "Unauthorized Access" });
  }
};


async function run() {
  try {
    // await client.connect();
    const db = client.db('AiMODELDAtabase');
    const modelCollection = db.collection('AllMOdels');
    const purchseCollection =db.collection('purchase')

    // Get all models find,find
    app.get('/models',veryfeyToken, async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result);
    });
    app.get("/models/:id",veryfeyToken, async(req,res)=>{
      const {id }= req.params
    
      const result = await modelCollection.findOne({_id: new ObjectId(id)})
      res.send(result)

    })
// getLetestData for homePage
const latestDAtaToken = async (req, res, next) => {
  const authoriz = req.headers.authorization;
  if (!authoriz) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  const token = authoriz.split(" ")[1];

  try {
    const decodedValue = await admin.auth().verifyIdToken(token);
    req.decoded = decodedValue; // attach decoded token (email, uid, etc.)
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).send({ message: "Unauthorized Access" });
  }
};


app.get('/latestModels', async (req, res) => {
  try {
    const result = await modelCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.send(result); 
  } catch (error) {
    console.error(" Failed to fetch latest models:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


//////Post m

app.post('/models',async(req,res)=>{
  const Data =req.body
  const result =await modelCollection.insertOne(Data)
res.send(result)
})
/////put data for update 
app.put("/models/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: updatedData };

  try {


    const result = await modelCollection.updateOne(filter, updateDoc);
    res.send({ success: true, result });
  } catch (err) {
    console.error(" Update Error:", err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});
// delet api
app.delete("/models/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  try {
    const result = await modelCollection.deleteOne(query);
    if (result.deletedCount > 0) {
      res.send({ success: true, message: "Model deleted successfully" });
    } else {
      res.status(404).send({ success: false, message: "Model not found" });
    }
  } catch (err) {
   
    res.status(500).send({ success: false, message: "Server Error" });
  }
});
// 🔹 Verify Firebase token middleware
// 🔹 Firebase token verification middleware


// 🔹 GET: My Added Models (for logged-in user)
app.get("/my-add-model", latestDAtaToken, async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    // ✅ match your frontend `createdBy` field (case-sensitive!)
    const query = { createdBy: email };

    const result = await modelCollection.find(query).toArray();

    res.send(result || []);
  } catch (error) {
    console.error("❌ Error fetching user's models:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});






// get my models from  my adding data
app.post('/purchase/:id', async (req, res) => {
const data = req.body
const id = req.params.id
  const result = await purchseCollection.insertOne(data);
  const filter = {_id:new ObjectId(id)}
  const update ={
    $inc:{
      purchased: 1
    }
  }
  const purchesCount = await modelCollection.updateOne(filter,update

  )
  res.send(result,purchesCount);
});

app.get('/mypurchase',latestDAtaToken, async (req, res) => {
  const email = req.query.email;
  const result = await purchseCollection.find({ purchasedBy: email }).toArray();
  res.send(result);
});


app.get('/search',async (req,res)=>{
const search_text = req.query.search
const result =await modelCollection.find({name: {$regex: search_text,$options:"i"}}) .toArray()
res.send(result)
})









    // Root route
    app.get('/', (req, res) => {
      res.send('AI Model Inventory API running...');
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);