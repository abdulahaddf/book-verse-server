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
    const bestSellingAndRecentSelling = database.collection("bestSellingAndRecentSelling");
 




    // get all books  start by Tonmoy

    app.get("/allBooks", async (req, res) => {
      const result = await allBooksCollections.find().toArray();

      res.send(result);
    });
    // get all books  end by Tonmoy

    // get single book by id  start by Tonmoy

    app.get("/singleBook/:id", async (req, res) => {
      const id = req.params.id;

      const find = { _id: new ObjectId(id) };

      const result = await allBooksCollections.findOne(find);

      res.send(result);
    });
    // get single book id  end by Tonmoy

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
 app.post('/create-payment-intent', async (req, res) => {
  try {
    const { price } = req.body;
    if (!price) {
      return res.status(400).json({ error: 'Missing price in request body' });
    }

    // Convert the price to a whole number in cents
    const amount = Math.round(parseFloat(price) * 100);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'An error occurred while creating the payment intent' });
  }
});


// payment related api
app.post('/payments', async (req, res) => {
  const payment = req.body
  console.log('pay',payment);
  const result = await paymentCollection.insertOne(payment)
  console.log('res',result);
  res.send(result)
})


// post  best selling & recent selling start by tonmoy

app.post('/bestSellingAndRecentSelling', async (req, res) => {
  try {
    const booksData = req.body;

    const { previous_id, count = count || 1, purchase_date } = booksData;

    let result;

    const existingBook = await bestSellingAndRecentSelling.findOne({ previous_id });

    if (existingBook) {
      const totalCount = existingBook.count + count;

      result = await bestSellingAndRecentSelling.updateOne(
        { previous_id },
        {
          $set: {
            count: totalCount,
            purchase_date
          }
        }
      );
    } else {
      const newData = { ...booksData, count: count, purchase_date: purchase_date };
      result = await bestSellingAndRecentSelling.insertOne(newData);
    }

    console.log('Database update result:', result);

    res.status(200).json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});



// post  best selling & recent selling end by Tonmoy


//  get best selling data  start by Tonmoy

app.get('/bestSelling',async(req,res)=>{


  const result= await bestSellingAndRecentSelling.find().sort({count: -1}).toArray();

    res.send(result)

})


//  get best selling data  end by  Tonmoy


//  get recent selling data  start by Tonmoy

app.get('/recentSelling',async(req,res)=>{


  const result= await bestSellingAndRecentSelling.find().sort({purchase_date: -1}).toArray();

    res.send(result)

})


//  get recent selling data  end by  Tonmoy



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
