require('dotenv').config();
const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express()
const port = process.env.PORT || 8085

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sxdrhxr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});
const dbConnect = async () => {
   try {
      // client.connect()
      console.log('DB Connected Successfully✅')
   } catch (error) {
      console.log(error.name, error.message)
   }
}


dbConnect()
app.get('/', (req, res) => {
   res.send('EcoSmart Bins is running!!');
})


app.listen(port, () => {
   console.log(`Server is running on port ${port}`)
})