require("dotenv").config();
const express = require("express");

const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 8085;
// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://eco-smart-bins.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.axstdh0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const dbConnect = async () => {
  try {
    //  await client.connect();
    const ecoSmartBins = client.db("ecoSmartBins");
    const services = ecoSmartBins.collection("services");
    const products = ecoSmartBins.collection("products");

    // products data for shop page
    app.get("/products", async (req, res) => {
      const item = req.body;
      data = await products.find().toArray(item);
      res.send(data);
    });

    // single product data for shop page
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await products.findOne(filter);
      res.send(result);
    });

    //service all data
    app.get("/services", async (res, req) => {
      const limit = parseInt(res.query.q);
      let data;
      if (limit) {
        data = await services.find().limit(limit).toArray();
        req.send(data);
        return;
      }
      data = await services.find().toArray();
      req.send(data);
    });

    //service a data by id
    app.get("/services/:id", async (res, req) => {
      const id = res.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await services.findOne(query);
      req.send(data);
    });
    //service add new data
    app.post("/services", async (res, req) => {
      const data = res.body;
      const addData = await services.insertOne(data);
      req.send(addData);
    });

    //delete a service
    app.delete("/services/:id", async (res, req) => {
      const id = res.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteData = await services.deleteOne(query);
      req.send(deleteData);
    });

    //update a service
    app.patch("/services/:id", async (res, req) => {
      const id = res.params.id;
      const query = { _id: new ObjectId(id) };
      const data = res.body;
      const updateDoc = {
        $set: {
          img: data.img,
          title: data.title,
          drescaption: data.drescaption,
        },
      };
      const options = { upsert: true };
      const updateData = await services.updateOne(query, updateDoc, options);
      req.send(updateData);
    });

    console.log("DB Connected Successfully✅");
  } catch (error) {
    console.log(error.name, error.message);
  }
};

dbConnect();
app.get("/", (req, res) => {
  res.send("EcoSmart Bins is running!!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
