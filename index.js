require("dotenv").config();
const express = require("express");

const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 8085;
// middleware
// , "https://eco-smart-bins.netlify.app"
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
    const reviewCollection = ecoSmartBins.collection("reviews");

    const blogs = ecoSmartBins.collection("blogs");
    const products = ecoSmartBins.collection("products");
    const myCart = ecoSmartBins.collection("myCart");

    // get cart data for my cart page
    app.post("/my-cart", async (req, res) => {
      const item = req.body;
      const result = await myCart.insertOne(item);
      res.send(result);
    });

    // post products 
    app.post('/products', async(req, res) =>{
      const product = req.body;
        const productData = await products.insertOne(product)
        res.send(productData)
    })
    // get products data for shop page
    app.get("/products", async (req, res) => {
      const item = req.body;
      data = await products.find().toArray(item);
      res.send(data);
    });

    // single product data for shop page
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await products.findOne(filter);
      res.send(result);
    });

      //update a product
      app.patch("/products/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const data = req.body;
        const updateDoc = {
          $set: {
            img: data.img,
            title: data.title,
            price: data.price,
            description: data.description,
          },
        };
        const options = { upsert: true };
        const updateData = await products.updateOne(query, updateDoc, options);
        res.send(updateData);
      });

    //service all data
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.q);
      let data;
      if (limit) {
        data = await services.find().limit(limit).toArray();
        res.send(data);
        return;
      }
      data = await services.find().toArray();
      res.send(data);
    });

    //service a data by id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await services.findOne(query);
      res.send(data);
    });
    //service add new data
    app.post("/services", async (req, res) => {
      const data = req.body;
      const addData = await services.insertOne(data);
      res.send(addData);
    });

    //delete a service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteData = await services.deleteOne(query);
      res.send(deleteData);
    });

    //update a service
    app.patch("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          img: data.img,
          title: data.title,
          drescaption: data.drescaption,
        },
      };
      const options = { upsert: true };
      const updateData = await services.updateOne(query, updateDoc, options);
      res.send(updateData);
    });

    //blogs all data
    app.get("/blogs", async (req, res) => {
      const data = await blogs.find().toArray();
      res.send(data);
    });

    //blog a data by id
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await blogs.findOne(query);
      res.send(data);
    });

    //  get reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    //
    app.post("/pickupReq", async (req, res) => {
      const data = req.body;
      console.log(data);
      const addData = await pickupReq.insertOne(data);
      res.send(addData);
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
