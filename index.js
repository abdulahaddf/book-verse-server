const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)

// middleware
app.use(cors());
app.use(express.json());

// Data-Base start
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@book-verse.uifvr5z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version--------
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
    // await client.connect();

    const database = client.db("bookVerse");
    const allBooksCollections = database.collection("allBooks");
    const usersCollection = database.collection("users");
    const paymentCollection = database.collection("payments");
 




    // get all books  start

    app.get("/allBooks", async (req, res) => {
      const result = await allBooksCollections.find().toArray();

      res.send(result);
    });
    // get all books  end

    // get single book by id  start

    app.get("/singleBook/:id", async (req, res) => {
      const id = req.params.id;

      const find = { _id: new ObjectId(id) };

      const result = await allBooksCollections.findOne(find);

      res.send(result);
    });
    // get single book id  end

    //user related api
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //------------------ Post method start------------------
    app.post("/allBooks", async (req, res) => {
      const newBook = req.body;
      console.log(newBook);
      const result = await allBooksCollections.insertOne(newBook);
      res.send(result);
    });
    //------------------ Post method end------------------


 // payment intent
 app.post('/create-payment-intent',  async (req, res) => {
  console.log(req);
  const { price } = req.body
  const amount = parseFloat(price) * 100
  if (!price) return
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
  })

  res.send({
    clientSecret: paymentIntent.client_secret,
  })
})

// payment related api
app.post('/payments', async (req, res) => {
  const payment = req.body
  console.log('pay',payment);
  const result = await paymentCollection.insertOne(payment)
  console.log('res',result);
  res.send(result)
})


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
