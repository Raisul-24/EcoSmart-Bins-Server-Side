require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 8085;
const port2 = process.env.PORT || 3000;

//const { Server } = require("socket.io");
//const { createServer } = require("http");
//
//const server = createServer(app);
//const io = new Server(server);

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://eco-smart-bins.netlify.app",
    ],

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
    const users = ecoSmartBins.collection("users");
    const services = ecoSmartBins.collection("services");
    const reviewCollection = ecoSmartBins.collection("reviews");
    const blogs = ecoSmartBins.collection("blogs");
    const products = ecoSmartBins.collection("products");
    const myCart = ecoSmartBins.collection("myCart");
    const showcaseCollection = ecoSmartBins.collection("showcase");
    const artCollection = ecoSmartBins.collection("artworks");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user)
      const token = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // middleware for verifying jwt
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await users.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }


    //change status value
    app.patch("/my-cart/:id", async (req, res) => {
      const query = req.body;
      //console.log("query", query);
      const id = req.params.id;
      console.log(id);
      const filter = { _id: id };
      const update = {
        $set: {
          status: query?.status,
        },
      };
      console.log(update);
      const result = await myCart.updateOne(filter, update);
      res.send(result);
    });

    app.get("/my-cart", verifyToken, async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        //console.log(query);
        const result = await myCart.find(query).toArray();
        //console.log(result);
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });
    // get all users
    app.get('/users', verifyToken, async (req, res) => {
      console.log(req.headers)
      const result = await users.find().toArray();
      res.send(result)
    })
    // post user data for registration
    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exists.
      const query = { email: user.email };
      const existingUser = await users.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }

      const result = await users.insertOne(user);
      res.send(result);
    });
    // get user data
    app.get("/users", async(req, res) => {
      const userData = await users.find().toArray()
      res.send(userData)
    });

    // get cart data for my cart page
    app.post("/my-cart", async (req, res) => {
      const item = req.body;
      const result = await myCart.insertOne(item);
      res.send(result);
    });

    // post products
    app.post("/products", async (req, res) => {
      const product = req.body;
      const productData = await products.insertOne(product);
      res.send(productData);
    });
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
    // delete products
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await products.deleteOne(query);
      res.send(result);
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

    // add showcase
    app.post("/showcase", async (req, res) => {
      const showcase = req.body;
      const result = await showcaseCollection.insertOne(showcase);
      res.send(result);
    });

    app.get("/showcase", async (req, res) => {
      const data = await showcaseCollection.find().toArray();
      res.send(data);
    });

    app.delete("/showcase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteData = await showcaseCollection.deleteOne(query);
      res.send(deleteData);
    });

    // art work
    app.post("/artworks", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await artCollection.insertOne(data);
      if (result) {
        const id = data.oldId;
        const query = { _id: new ObjectId(id) };
        await showcaseCollection.deleteOne(query);
      }
      res.send(result);
    });

    app.get("/artworks", async (req, res) => {
      const result = await artCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    console.log("DB Connected Successfully✅");
  } catch (error) {
    console.log(error.name, error.message);
  }
};

//socket.io connection conformation
//io.on("connection", (socket) => {
//  console.log("User Connected", socket.id);
//
//  socket.on("message", ({ room, message }) => {
//    console.log({ room, message });
//    socket.to(room).emit("receive-message", message);
//  });
//  socket.on("join-room", (room) => {
//    socket.join(room);
//    console.log(`User joined room ${room}`);
//  });
//  socket.on("disconnect", () => {
//    console.log("User Disconnected", socket.id);
//  });
//});

dbConnect();
app.get("/", (req, res) => {
  res.send("EcoSmart Bins is running!!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//server.listen(port2, () => {
//  console.log(`Server is running on port ${port2}`);
//});
