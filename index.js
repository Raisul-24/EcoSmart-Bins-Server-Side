require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
// const formData = require("form-data");
// const Mailgun = require("mailgun.js");
// const mailgun = new Mailgun(formData);
// const mg = mailgun.client({
//   username: "api",
//   key: process.env.MAIL_GUN_API_KEY,
// });

const port = process.env.PORT || 8085;
const http = require("http");
const socketIO = require("socket.io");
const config = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://eco-smart-bins.netlify.app",
  ],
  credentials: true,
};
const server = http.createServer(app);
const io = socketIO(server, {
  cors: config,
});
// ssl
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; //true for live, false for sandbox
const dev = false;

// client side server url
const clientSideUrl = dev
  ? "http://localhost:5173"
  : "https://eco-smart-bins.netlify.app";

// server side server url
const serverSideUrl = dev
  ? "http://localhost:8085"
  : "https://ecosmart-bins-server-side.onrender.com";
// middleware
app.use(cors(config));
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
    const servicesCategories = ecoSmartBins.collection("servicesCategory");
    const products = ecoSmartBins.collection("products");
    const myCart = ecoSmartBins.collection("myCart");
    const showcaseCollection = ecoSmartBins.collection("showcase");
    const artCollection = ecoSmartBins.collection("artworks");
    const pickupReq = ecoSmartBins.collection("pickupReq");
    const team = ecoSmartBins.collection("teams");
    const industries = ecoSmartBins.collection("industries");
    const industriesCategory = ecoSmartBins.collection("industriesCategory");
    const serviceDetailsChart = ecoSmartBins.collection("serviceDetailsChart");
    const orderCollection = ecoSmartBins.collection("orders");
    const notification = ecoSmartBins.collection("notification");
    const careerCollection = ecoSmartBins.collection("career");
    const application = ecoSmartBins.collection("application");
    const subscriberCollection = ecoSmartBins.collection("subscriber");

    //this code for socketIo

    app.get("/", (req, res) => {
      res.send("Socket.IO Server is running!");
    });

    let ioUsers = [];

    const addUser = (userId, socketId) => {
      !ioUsers.some((user) => user.userId === userId) &&
        ioUsers.push({ userId, socketId });
    };

    const removeUser = (socketId) => {
      ioUsers = ioUsers.filter((user) => user.socketId !== socketId);
    };

    const getUser = (receiverId) => {
      return ioUsers.find((user) => user.userId === receiverId);
    };

    io.on("connection", (socket) => {
      console.log("A user is connected");
      //add user
      socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", "wellcome");
      });
      //notification
      socket.on("notification", async (data) => {
        const { email, type, sentData } = data;
        if (type === "sent") {
          await notification.insertOne(sentData);
        }
        const query = { email };
        const find = await notification
          .find(query)
          .sort({ date: -1 })
          .limit(20)
          .toArray();
        io.emit("receive-notification", find);
      });

      // Handle other socket events...

      socket.on("disconnect", () => {
        console.log("A user disconnected!");
        removeUser(socket.id);
      });
    });

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleware for verifying jwt
    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await users.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

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

    app.get("/my-cart", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        // console.log(query);
        const result = await myCart.find(query).toArray();
        // console.log(result);
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    // get all category of industries
    app.get("/industries-category", async (req, res) => {
      const result = await industriesCategory.find().toArray();
      res.send(result);
    });
    // get all industries
    app.get("/industries", async (req, res) => {
      const result = await industries.find().toArray();
      res.send(result);
    });

    //service a data by id
    app.get("/industry/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await industries.findOne(query);
      res.send(data);
    });

    app.get("/team", async (req, res) => {
      const result = await team.find().toArray();
      res.send(result);
    });

    // get chart for serviceDetails
    app.get("/serviceDetails-chart", async (req, res) => {
      const result = await serviceDetailsChart.find().toArray();
      res.send(result);
    });

    // get all teams
    app.get("/service-category", async (req, res) => {
      const result = await servicesCategories.find().toArray();
      res.send(result);
    });

    // get all users
    app.get("/users", verifyToken, async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });
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
    //change user role
    app.patch("/user/:id", async (req, res) => {
      const query = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          role: query?.role,
        },
      };
      const result = await users.updateOne(filter, update);
      res.send(result);
    });

    //delete user
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });

    // get cart data for my cart page
    app.post("/my-cart", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await myCart.insertOne(item);
      res.send(result);
    });
    app.delete("/my-cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myCart.deleteOne(query);
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
      const page = parseInt(req?.query?.Page);
      const size = parseInt(req.query.size);
      console.log(page, size);
      let query = {};
      if (req.query.category?.length > 0) {
        query = { category: req.query.category };
      }
      if (req.query.search?.length > 0) {
        query = {
          title: { $regex: req.query.search, $options: "i" },
        };
      }
      if (req.query.search?.length > 0 && req.query.category?.length > 0) {
        query = {
          title: { $regex: req.query.search, $options: "i" },
          category: req.query.category,
        };
      }
      const data = await products
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(data);
    });
    app.get("/productsCategory", async (req, res) => {
      const data = await products.find().toArray();
      const shopCategory = [];
      data?.forEach((item) => {
        if (!shopCategory.includes(item?.category))
          shopCategory.push(item?.category);
      });
      res.send(shopCategory);
    });
    //total product count
    app.get("/totalproducts", async (req, res) => {
      const data = await products.estimatedDocumentCount();
      res.send({ count: data });
    });

    app.get("/adminOverview", async (req, res) => {
      const service = await services.estimatedDocumentCount();
      const user = await users.estimatedDocumentCount();
      const product = await products.estimatedDocumentCount();
      const data = [
        { name: "services", total: service },
        { name: "users", total: user },
        { name: "products", total: product },
      ];
      res.send(data);
    });
    app.get("/workerOverview/:email", async (req, res) => {
      const workerEmail = req.params.email;
      const ongoing = await pickupReq
        .find({
          workerEmail,
          status: "ongoing",
        })
        .toArray();
      const complete = await pickupReq
        .find({
          workerEmail,
          status: "complete",
        })
        .toArray();
      const data = [
        { name: "ongoing", total: ongoing?.length },
        { name: "complete", total: complete?.length },
      ];
      res.send(data);
    });
    app.get("/userOverview/:email", async (req, res) => {
      const email = req.params.email;
      const cart = await myCart
        .find({
          email,
        })
        .toArray();
      const pickup = await pickupReq
        .find({
          email,
        })
        .toArray();
      const order = await orderCollection
        .find({
          "payableOrder.cus_email": email,
        })
        .toArray();
      const data = [
        { name: "my cart", total: cart?.length },
        { name: "pickupReq", total: pickup?.length },
        { name: "order", total: order?.length },
      ];
      res.send(data);
    });

    // single product data for shop page
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await products.findOne(filter);

      const query = {
        _id: { $not: { $eq: new ObjectId(id) } },
        category: result?.category,
      };
      const find = await products.find(query).toArray();
      res.send({ details: result, category: find });
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
      const page = parseInt(req?.query?.page);
      const size = parseInt(req.query.size);

      let query = {};

      if (req.query.search?.length > 0 && req.query.category?.length > 0) {
        query = {
          $and: [
            { name: { $regex: req.query.search, $options: "i" } },
            { category: req.query.category },
          ],
        };
      } else if (req.query.search?.length > 0) {
        query = {
          name: { $regex: req.query.search, $options: "i" },
        };
      } else if (req.query.category?.length > 0) {
        query = { category: req.query.category };
      }

      const data = await blogs
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();

      res.send(data);
    });

    //total blogs count
    app.get("/total-blogs", async (req, res) => {
      const data = await blogs.estimatedDocumentCount();
      res.send({ count: data });
    });

    app.get("/blogsCategory", async (req, res) => {
      const data = await blogs.find().toArray();
      const shopCategory = [];
      data?.forEach((item) => {
        if (!shopCategory.includes(item?.category))
          shopCategory.push(item?.category);
      });
      res.send(shopCategory);
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

    // subscriber
    app.post("/subscribe", async (req, res) => {
      const subscriber = req.body;
      const result = await subscriberCollection.insertOne(subscriber);
      res.send(result);

      //  send subscriber email
      // mg.messages
      //   .create(process.env.MAIL_SENDING_DOMAIN, {
      //     from: "Mailgun Sandbox <postmaster@sandbox46554d9e079740e1a0ba77a562348465.mailgun.org>",
      //     to: ["rawshanara.eity@gmail.com"],
      //     subject: "Hello,EcoSmartBins subscription confrimation",
      //     text: "Testing some Mailgun awesomness!",
      //     html: `
      //     <div>
      //     <h2>Thank you for your subscription</h2>
      //     <p>Wellcome to our EcoSmartBins For a cleaner plannet</p>
      //     </div>
      //     `,
      //   })
      //   .then((msg) => console.log(msg)) // logs response data
      //   .catch((err) => console.log(err));
    });

    //pickUp get data
    app.get("/pickupReq", async (req, res) => {
      const result = await pickupReq.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    // get data based on user email

    //get all pickup data
    app.get("/pickupReqAll", async (req, res) => {
      const result = await pickupReq
        .find({ workerEmail: null })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    //update worker
    app.patch("/pickupReq/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          workerEmail: data?.email,
        },
      };
      const updateData = await pickupReq.updateOne(query, updateDoc);
      res.send(updateData);
    });
    app.get("/userpickupReq/:email", async (req, res) => {
      const email = req.params.email;
      const result = await pickupReq
        .find({ email })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });
    //get data base to status
    app.get("/pickupReq/:email", async (req, res) => {
      const workerEmail = req.params.email;
      const status = req.query.status;
      const result = await pickupReq
        .find({ workerEmail, status })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });
    //status update
    app.patch("/statusUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          status: data?.status,
        },
      };
      const updateData = await pickupReq.updateOne(query, updateDoc);
      res.send(updateData);
    });
    // pickUp Req post
    app.post("/pickupReq", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const query = { email: data?.email, status: "ongoing" };
      const isExist = await pickupReq.findOne(query);
      console.log(isExist);
      if (isExist) {
        return res.send({
          message: "request already exists",
          insertedId: null,
        });
      }
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
      const result = await team.insertOne(data);
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

    // career
    app.get("/career", async (req, res) => {
      const data = await careerCollection.find().toArray();
      res.send(data);
    });

    app.post("/career", async (req, res) => {
      const data = req.body;
      const jobData = await careerCollection.insertOne(data);
      res.send(jobData);
    });

    // application
    app.post("/application", async (req, res) => {
      const data = req.body;
      const applyData = await application.insertOne(data);
      res.send(applyData);
    });

    app.get("/application", async (req, res) => {
      const data = await application.find().toArray();
      res.send(data);
    });

    app.delete("/application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteData = await application.deleteOne(query);
      res.send(deleteData);
    });

    app.get("/career/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await careerCollection.findOne(filter);
      res.send(result);
    });

    // payment

    app.get("/order", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.post("/order", async (req, res) => {
      const transaction_id = new ObjectId().toString();
      const order = req.body;
      // payable data store in mngo db
      const payableOrder = {
        product_name: order?.title,
        cus_name: order?.CustomerName,
        cus_email: order?.CustomerEmail,
        cus_phone: order?.CustomerMobile,
        cus_add1: order?.CustomerCity,
        cus_add2: order?.CustomerAddress,
        total_amount: order?.totalPrice,
      };
      console.log("order", order);
      const data = {
        total_amount: order?.totalPrice,
        currency: "BDT",
        tran_id: transaction_id, // use unique tran_id for each api call
        success_url: `${serverSideUrl}/payment/success/${transaction_id}`,
        fail_url: `${serverSideUrl}/payment/fail/${transaction_id}`,
        cancel_url: `${serverSideUrl}/payment/cancel`,
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: order?.title,
        product_category: "Electronic",
        product_profile: "general",
        cus_name: order?.CustomerName,
        cus_email: order?.CustomerEmail,
        cus_add1: order?.CustomerCity,
        cus_add2: order?.CustomerAddress,
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: order?.CustomerMobile,
        // cus_fax: '01711111111',
        ship_name: order?.CustomerName,
        ship_add1: order?.CustomerCity,
        ship_add2: order?.CustomerAddress,
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        const finalOrder = {
          payableOrder,
          paidStatus: false,
          transaction_ID: transaction_id,
        };
        const result = orderCollection.insertOne(finalOrder);

        console.log("Redirecting to: ", GatewayPageURL);
      });

      app.post("/payment/success/:transaction_id", async (req, res) => {
        console.log(req.params.transaction_id);
        const result = await orderCollection.updateOne(
          { transaction_ID: req.params.transaction_id },
          {
            $set: {
              paidStatus: true,
            },
          }
        );
        if (result.modifiedCount > 0) {
          res.redirect(
            `${clientSideUrl}/payment/success/${req.params.transaction_id}`
          );
        }
      });

      app.post('/payment/cancel', async(req, res) =>{
        res.redirect(
          `${clientSideUrl}/payment/cancel`
        );
      })

      app.post("/payment/fail/:transaction_id", async (req, res) => {
        const result = await orderCollection.deleteOne({
          transaction_ID: req.params.transaction_id,
        });
        if (result.deletedCount) {
          res.redirect(``);
        }
      });
    });
    app.post("/cart-order", async (req, res) => {
      const transaction_id = new ObjectId().toString();
      const order = req.body;
      // payable data store in mngo db
      const data = {
        total_amount: order?.totalPrice,
        currency: "BDT",
        tran_id: transaction_id, // use unique tran_id for each api call
        success_url: `${serverSideUrl}/cart-order/success/${transaction_id}`,
        fail_url: `${serverSideUrl}/cart-order/fail/${transaction_id}`,
        cancel_url: `${clientSideUrl}/payment/cancel`,
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "null",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "null",
        cus_email: "null",
        cus_add1: "null",
        cus_add2: "null",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "null",
        // cus_fax: '01711111111',
        ship_name: "null",
        ship_add1: "null",
        ship_add2: "null",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
      });

      app.post("/cart-order/success/:transaction_id", async (req, res) => {
        console.log(req.params.transaction_id);
        const result = await myCart.deleteMany({
          email: order.email,
        });
        if (result.deletedCount) {
          res.redirect(
            `${clientSideUrl}/payment/success/${req.params.transaction_id}`
          );
        }
      });

      app.post("/cart-order/fail/:transaction_id", async (req, res) => {
        res.redirect(clientSideUrl);
      });
    });
    app.patch("/subscription", async (req, res) => {
      const transaction_id = new ObjectId().toString();
      const subscription = req.body;
      // payable data store in mngo db
      const data = {
        total_amount: subscription?.price,
        currency: "BDT",
        tran_id: transaction_id, // use unique tran_id for each api call
        success_url: `${serverSideUrl}/subscription/success/${transaction_id}`,
        fail_url: `${serverSideUrl}/subscription/fail/${transaction_id}`,
        cancel_url: `${clientSideUrl}/payment/cancel`,
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "null",
        product_category: subscription?.status,
        product_profile: "general",
        cus_name: subscription?.name,
        cus_email: subscription?.email,
        cus_add1: "null",
        cus_add2: "null",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "null",
        ship_add1: "null",
        ship_add2: "null",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
      });
      app.post("/subscription/success/:transaction_id", async (req, res) => {
        const filter = { email: subscription?.email };
        const update = {
          $set: {
            status: subscription?.status,
            subscriptionTime: subscription?.subscriptionTime,
          },
        };
        const options = { upsert: true };
        const result = await users.updateOne(filter, update, options);
        res.redirect(
          `${clientSideUrl}/payment/success/${req.params.transaction_id}`
        );
      });

      app.post("/subscription/fail/:transaction_id", async (req, res) => {
        const filter = { email: subscription?.email };
        const update = {
          $set: {
            status: null,
            subscriptionTime: null,
          },
        };
        const options = { upsert: true };
        const result = await users.updateOne(filter, update, options);
        res.redirect(`/`);
      });
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

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
