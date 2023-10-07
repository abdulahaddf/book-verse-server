const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

exports.verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// Data-Base start
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@book-verse.uifvr5z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version--------
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //exporting mongoDB collections
    const database = client.db("bookVerse");
    exports.allBooksCollections = database.collection("allBooks");
    exports.usersCollection = database.collection("users");
    exports.paymentCollection = database.collection("payments");
    exports.oldBooksCollection = database.collection("oldBooks");
    exports.bestSellingAndRecentSelling = database.collection(
      "bestSellingAndRecentSelling"
    );
    exports.promoCodesCollection = database.collection("promoCodes");
    exports.userToUser = database.collection("userToUser");
    exports.bannersCollection = database.collection("banners");
    const userToUser = database.collection("userToUser");



    // Check the result of the index creation start by Tonmoy
    const result = await userToUser.createIndex(
      { seller: 1, buyer: 1 },
      { unique: true }
    );

    if (result) {
      console.log("Unique index on seller and buyer fields created.");
    } else {
      console.error("Error creating unique index on seller and buyer fields.");
    }
    // Check the result of the index creation end by Tonmoy
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });

      res.send({ token });
    });
//All routes
    const bookRoutes = require("./routes/allBook.js");
    const bestRoutes = require("./routes/bestAndRecentBooks");
    const chatRoutes = require("./routes/chat");
    const oldBooksRoutes = require("./routes/oldBooks");
    const paymentRoutes = require("./routes/payments");
    const promoRoutes = require("./routes/promoCodes");
    const userRoutes = require("./routes/users");
    const bannerRoutes = require("./routes/banners");
    
//middlewares
    app.use(bookRoutes);
    app.use(bestRoutes);
    app.use(chatRoutes);
    app.use(oldBooksRoutes);
    app.use(paymentRoutes);
    app.use(promoRoutes);
    app.use(userRoutes);
    app.use(bannerRoutes);

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// Data-Base end

app.get("/", (req, res) => {
  res.send("Book Verse server is running");
});

app.listen(port, () => {
  console.log(`Book Verse Server is running on port: ${port}`);
});
