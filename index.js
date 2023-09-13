const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken'); const SSLCommerzPayment = require('sslcommerz-lts')

const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' });
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

// SSlCommerz id start key start Tonmoy

const store_id = `${process.env.SSLCOMMERZ_ID}`;
const store_passwd = `${process.env.SSLCOMMERZ_PASSWORD}`;
const is_live = false; //true for live, false for sandbox

// SSlCommerz id end key end Tonmoy

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("bookVerse");
    const allBooksCollections = database.collection("allBooks");
    const usersCollection = database.collection("users");
    const paymentCollection = database.collection("payments");
    const oldBooksCollection = database.collection("oldBooks");
    const bestSellingAndRecentSelling = database.collection("bestSellingAndRecentSelling");
    const promoCodesCollection = database.collection("promoCodes");
    const userToUser = database.collection("userToUser")
    const bannersCollection = database.collection("banners")


    const result = await userToUser.createIndex({ seller: 1, buyer: 1 }, { unique: true });

    // Check the result of the index creation start by Tonmoy
    if (result) {
      console.log('Unique index on seller and buyer fields created.');
    } else {
      console.error('Error creating unique index on seller and buyer fields.');
    }
    // Check the result of the index creation end by Tonmoy




    // jwt by nahid start----------------

    // app.post("/jwt", (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })

    //   res.send({ token })
    // })

    app.post("/jwt", (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        res.send({ token });
      } catch (error) {
        // Handle the error here
        console.error(error);
        res.status(500).send("Internal Server Error"); // You can customize the error response as needed
      }
    });


    // jwt by nahid end--------------



    // get all books  start by Tonmoy---------------

    // app.get("/allBooks", async (req, res) => {
    //   const result = await allBooksCollections.find().toArray();

    //   res.send(result);
    // });
    app.get("/allBooks", async (req, res) => {
      try {
        // Fetch all books from the collection
        const result = await allBooksCollections.find().toArray();
        res.json(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error fetching all books:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });

    // get all books  end by Tonmoy-------------

    // -------nhhasib manage banner
    app.get("/banners", async (req, res) => {
      const result = await bannersCollection.find().toArray();
      console.log(result)
      res.send(result)
    })

    app.post("/banners", async (req, res) => {
      const newBanner = req.body;
      console.log(newBanner)
      const result = await bannersCollection.insertOne(newBanner);
      res.send(result);
    })

    app.patch("/banner/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const editedBanner = req.body;
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          bannerURL: editedBanner.bannerURL,
          title: editedBanner.title,
          subtitle: editedBanner.subtitle
        }
      }
      const result = await bannersCollection.updateOne(query, updatedDoc, options);
      console.log(result)
      res.send(result)
    })

    app.delete("/banner/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bannersCollection.deleteOne(query);
      console.log(result);
      res.send(result)
    })



    // --------------------nhhasib end


    //review api Ahad start ----------------------------------
    app.post('/add-review', async (req, res) => {
      const { bookId, name, photo, rating, review, identifier, postDate } = req.body;
      console.log(bookId);
      try {
        const existingReview = await allBooksCollections.findOne({

          $and: [
            { _id: new ObjectId(bookId) },
            { 'review.identifier': identifier }
          ]
        });

        if (existingReview) {
          return res.status(400).json({ message: 'You have already reviewed this book' });
        }

        const updatedBook = await allBooksCollections.findOneAndUpdate(
          { _id: new ObjectId(bookId) },
          { $push: { review: { name, photo, rating, review, identifier, postDate } } },
          { returnOriginal: false }
        );

        if (!updatedBook.value) {
          return res.status(404).json({ message: 'Book not found' });
        }

        return res.json({ message: 'Review added successfully', book: updatedBook.value });
      } catch (error) {
        console.error('Error adding review:', error);
        return res.status(500).json({ message: 'An error occurred' });
      }
    });

    //  review api Ahad end ------------------------------------------



    //  review for bestSelling and recentSelling Tonmoy start ------------------------------------------


    app.post('/recentCellingAndBestCellingReview', async (req, res) => {

      try {

        const { bookId, name, photo, rating, review, identifier, postDate } = req?.body;

      

        const updatedBook = await bestSellingAndRecentSelling.findOneAndUpdate(
          { previous_id: bookId },
          { $push: { review: { name, photo, rating, review, identifier, postDate } } },
          { returnOriginal: false })

          console.log(updatedBook)

        if (!updatedBook.value) {
          return res.status(404).json({ message: 'Book not found' });
        }

      

        return res.json({ message: 'Done', book: updatedBook.value });
      } catch (error) {
        console.error('Error adding review:', error);
        return res.status(500).json({ message: 'An error occurred' });
      }


    })

    //  review for bestSelling and recentSelling Tonmoy end ------------------------------------------



    // get single book by id  start by Tonmoy ------------------

    // app.get("/singleBook/:id", async (req, res) => {
    //   const id = req.params.id;

    //   const find = { _id: new ObjectId(id) };

    //   const result = await allBooksCollections.findOne(find);

    //   res.send(result);
    // });

    app.get("/singleBook/:id", async (req, res) => {
      const id = req?.params?.id;

      try {
        const find = { _id: new ObjectId(id) };

        const result = await allBooksCollections.findOne(find);

        if (!result) {
          // If no book with the specified ID is found, send a 404 Not Found response
          return res.status(404).json({ message: 'Book not found' });
        }

        res.send(result);
      } catch (error) {
        // Handle the error here
        console.error('Error fetching single book:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });
    // get single book id  end by Tonmoy ---------------------------------







    //user related api
    // app.get("/users", async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   res.send(result);
    // });
    app.get("/users", async (req, res) => {
      try {
        // Fetch all users from the collection
        const result = await usersCollection.find().toArray();
        res.json(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });


    // app.get("/userinfo", async (req, res) => {
    //   const email = req.query.email;
    //   console.log(email)
    //   const query = { email: email };
    //   const result = await usersCollection.findOne(query);
    //   res.send(result)
    // });

    app.get("/userinfo", async (req, res) => {
      try {
        const email = req?.query?.email;
        console.log(email);

        const query = { email: email };
        const result = await usersCollection.findOne(query);

        if (!result) {
          // If no user with the specified email is found, send a 404 Not Found response
          return res.status(404).json({ message: 'User not found' });
        }

        res.send(result);
      } catch (error) {
        // Handle the error here
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    // app.post("/users", async (req, res) => {
    //   const user = req.body;
    //   console.log(user);
    //   const query = { email: user.email };
    //   const existingUser = await usersCollection.findOne(query);

    //   if (existingUser) {
    //     return res.send({ message: "user exists" });
    //   }

    //   const result = await usersCollection.insertOne(user);
    //   res.send(result);
    // });

    app.post("/users", async (req, res) => {
      try {
        const user = req?.body;
        console.log(user);
        const query = { email: user?.email };
        const existingUser = await usersCollection.findOne(query);

        if (existingUser) {
          return res.send({ message: "user exists" });
        }

        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        // Handle the error here
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });



    // app.patch("/userinfoupdate", async (req, res) => {
    //   const query = req.query.email;
    //   const filter = { email: query };
    //   const userinfo = req.body;
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       displayName: userinfo.displayName,
    //       address: userinfo.address,
    //       gender: userinfo.gender,
    //       birthday: userinfo.birthday,
    //       phoneNumber: userinfo.phoneNumber
    //     }
    //   }
    //   const result = await usersCollection.updateOne(filter, updateDoc, options);
    //   res.send(result)
    //   console.log(result)
    // });
    app.patch("/userinfoupdate", async (req, res) => {
      try {
        const query = req?.query?.email;
        const filter = { email: query };
        const userinfo = req?.body;
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            displayName: userinfo?.displayName,
            address: userinfo?.address,
            gender: userinfo?.gender,
            birthday: userinfo?.birthday,
            phoneNumber: userinfo?.phoneNumber
          }
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
        console.log(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error updating user information:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    // app.patch("/userpictureupdate", async (req, res) => {
    //   console.log('server clicked')
    //   const query = req.query.email;
    //   const filter = { email: query };
    //   const pitureinfo = req.body;
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       photoURL: pitureinfo.photoURL,
    //     }
    //   }
    //   const result = await usersCollection.updateOne(filter, updateDoc, options);
    //   res.send(result)
    //   console.log(result)
    // })

    app.patch("/userpictureupdate", async (req, res) => {
      try {
        console.log('server clicked')
        const query = req?.query?.email;
        const filter = { email: query };
        const pitureinfo = req?.body;
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            photoURL: pitureinfo?.photoURL,
          }
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
        console.log(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    // app.delete('/users/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await usersCollection.deleteOne(query)
    //   res.send(result)
    // })
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) }
        const result = await usersCollection.deleteOne(query)
        res.send(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    // make admin start by nahid 
    // app.get('/users/admin/:email', verifyJWT, async (req, res) => {
    //   const email = req.params.email;
    //   if (req.decoded.email !== email) {
    //     return res.send({ admin: false })
    //   }
    //   console.log(req.decoded.email)
    //   console.log(email)
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query);
    //   const result = { admin: user?.role === 'admin' }
    //   res.send(result)
    // });
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      try {
        const email = req?.params?.email;
        if (req?.decoded?.email !== email) {
          return res.send({ admin: false })
        }
        console.log(req?.decoded?.email)
        console.log(email)
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        const result = { admin: user?.role === 'admin' }
        res.send(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error checking admin role:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });





    // app.patch('/users/admin/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   }
    //   const result = await usersCollection.updateOne(filter, updateDoc);
    //   res.send(result)
    // })
    app.patch('/users/admin/:id', async (req, res) => {
      try {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'admin'
          }
        }
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });




    // make admin end by nahid 





    //------------------ Post method start by Zihad------------------
    // app.post("/allBooks", async (req, res) => {
    //   const newBook = req.body;
    //   // console.log(newBook);
    //   const result = await allBooksCollections.insertOne(newBook);
    //   res.send(result);
    // });
    app.post("/allBooks", async (req, res) => {
      try {
        const newBook = req?.body;
        // console.log(newBook);
        const result = await allBooksCollections.insertOne(newBook);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error adding a new book:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });

    //------------------ Post method end by Zihad------------------






    //------------------ Update method start by Zihad------------------

    app.put("/allBooks/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateBook = req.body;
        console.log(id, updateBook);

        const book = {
          $set: {
            title: updateBook.title,
            author: updateBook.author,
            category: updateBook.category,
            language: updateBook.language,
            real_price: updateBook.real_price,
            offer_price: updateBook.offer_price,
            page_numbers: updateBook.page_numbers,
            rating: updateBook.rating,
            published: updateBook.published,
            about_author: updateBook.about_author,
            description: updateBook.description,
            cover_image: updateBook.cover_image,
            author_image: updateBook.author_image,
          },
        };

        const result = await allBooksCollections.updateOne(
          filter,
          book,
          options
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Book updated successfully" });
        } else {
          res.status(404).send({ success: false, message: "Book not found" });
        }
      } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).send({ success: false, message: "An error occurred" });
      }
    });

    //------------------ Update method end by Zihad------------------

    //------------------ Delete method start by Zihad------------------
    // app.delete("/allBooks/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await allBooksCollections.deleteOne(query);
    //   res.send(result);
    // });
    app.delete("/allBooks/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await allBooksCollections.deleteOne(query);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error deleting book:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });

    //------------------ Delete method end by Zihad------------------



    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { price } = req.body;
        if (!price) {
          return res
            .status(400)
            .json({ error: "Missing price in request body" });
        }

        // Convert the price to a whole number in cents
        const amount = Math.round(parseFloat(price) * 100);

        if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({ error: "Invalid price" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({
          error: "An error occurred while creating the payment intent",
        });
      }
    });

    // payment related api
    // app.post("/payments", async (req, res) => {
    //   const payment = req.body;
    //   console.log("pay", payment);
    //   const result = await paymentCollection.insertOne(payment);
    //   console.log("res", result);
    //   res.send(result);
    // });

    app.post("/payments", async (req, res) => {
      try {

        const payment = req?.body;
        console.log("pay", payment);
        const result = await paymentCollection.insertOne(payment);
        console.log("res", result);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error processing payment:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    // app.get("/paymentHistory", async (req, res) => {
    //   const result = await paymentCollection
    //     .find()
    //     .sort({ date: -1 })
    //     .toArray();
    //   res.send(result);
    // });

    app.get("/paymentHistory", async (req, res) => {
      try {
        // Fetch payment history, sort by date in descending order
        const result = await paymentCollection.find().sort({ date: -1 }).toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });

    // -------------- update status start by  foisal 

    // app.patch("/paymentStatus/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const statusdata = req.body;
    //   // const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       status: statusdata.status
    //     }
    //   }
    //   // console.log(id,statusdata)
    //   const result = await paymentCollection.updateOne(filter, updateDoc);
    //   res.send(result)
    // })
    app.patch("/paymentStatus/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const statusdata = req?.body;
        // const options = { upsert: true };
        const updateDoc = {
          $set: {
            status: statusdata?.status
          }
        }
        // console.log(id,statusdata)
        const result = await paymentCollection.updateOne(filter, updateDoc);
        res.send(result)
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    // -------------- update status end by  foisal 



    // revenue start by Zihad----------------------------------

    app.get("/revenueSummary", async (req, res) => {
      try {
        const payments = await paymentCollection.find().toArray();

        const currentDate = new Date();
        const todayDate = currentDate.toISOString().split("T")[0];

        let totalRevenue = 0;
        let totalRevenueCurrentMonth = 0;
        let totalRevenueToday = 0;

        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const weeklyRevenue = {
          Sunday: 0,
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
        };

        payments.forEach((payment) => {
          const paymentDate = payment.date.split("T")[0];

          if (paymentDate === todayDate) {
            totalRevenueToday += payment.total_price || 0;
          }

          const [year, month] = paymentDate.split("-");
          const paymentYear = parseInt(year);
          const paymentMonth = parseInt(month);

          if (
            paymentYear === currentDate.getFullYear() &&
            paymentMonth === currentDate.getMonth() + 1
          ) {
            totalRevenueCurrentMonth += payment.total_price || 0;

            const paymentDay = new Date(
              paymentYear,
              paymentMonth - 1,
              parseInt(paymentDate.split("-")[2])
            );
            const dayOfWeek = daysOfWeek[paymentDay.getDay()];

            weeklyRevenue[dayOfWeek] += payment.total_price || 0;
          }

          totalRevenue += payment.total_price || 0;
        });

        res.json({
          totalRevenueToday: totalRevenueToday.toFixed(2),
          totalRevenueCurrentMonth: totalRevenueCurrentMonth.toFixed(2),
          totalRevenue: totalRevenue.toFixed(2),
          weeklyRevenue,
        });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // revenue end by Zihad----------------------------------


    // monthly revenue start by Zihad----------------------------------

    app.get("/monthlyRevenue", async (req, res) => {
      try {
        const payments = await paymentCollection.find().toArray();

        const monthlyRevenue = Array.from({ length: 12 }).map(() => 0);

        payments.forEach((payment) => {
          const paymentDate = new Date(payment.date);
          const paymentMonth = paymentDate.getMonth();

          const totalPayment = payment.total_price || 0;
          monthlyRevenue[paymentMonth] += totalPayment;
        });

        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        const formattedMonthlyRevenue = monthlyRevenue.map((revenue, index) => ({
          month: months[index],
          revenue: revenue.toFixed(2)
        }));

        res.json(formattedMonthlyRevenue);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // monthly revenue end by Zihad----------------------------------



    // daily revenue start by Zihad----------------------------------

    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];

    app.get("/dailyRevenue", async (req, res) => {
      try {
        const payments = await paymentCollection.find().toArray();

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let dailyRevenue = {};

        payments.forEach((payment) => {
          const paymentDate = payment.date.split("T")[0];
          const [paymentYear, paymentMonth, paymentDay] = paymentDate.split("-");

          if (parseInt(paymentYear) === currentYear && parseInt(paymentMonth) === currentMonth + 1) {
            const dayOfMonth = parseInt(paymentDay);
            const totalPayment = payment.total_price || 0;

            if (!dailyRevenue[dayOfMonth]) {
              dailyRevenue[dayOfMonth] = 0;
            }

            dailyRevenue[dayOfMonth] += totalPayment;
          }
        });

        const formattedDailyRevenue = [];

        for (let day = 1; day <= daysInMonth; day++) {
          formattedDailyRevenue.push({
            date: `${months[currentMonth]} ${day}`,
            revenue: (dailyRevenue[day] || 0).toFixed(2)
          });
        }

        res.json({ dailyRevenue: formattedDailyRevenue });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });


    // daily revenue end by Zihad----------------------------------



    // post  best selling & recent selling start by tonmoy-------------------

    app.post("/bestSellingAndRecentSelling", async (req, res) => {
      try {
        const booksData = req.body;

        const { previous_id, count = count || 1, purchase_date } = booksData;

        let result;

        const existingBook = await bestSellingAndRecentSelling.findOne({
          previous_id,
        });

        if (existingBook) {
          const totalCount = existingBook.count + count;

          result = await bestSellingAndRecentSelling.updateOne(
            { previous_id },
            {
              $set: {
                count: totalCount,
                purchase_date,
              },
            }
          );
        } else {
          const newData = {
            ...booksData,
            count: count,
            purchase_date: purchase_date,
          };
          result = await bestSellingAndRecentSelling.insertOne(newData);
        }

        console.log("Database update result:", result);

        res.status(200).json({ message: "Data updated successfully" });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });

    // post  best selling & recent selling end by Tonmoy-------------------

    //  get best selling data  start by Tonmoy------------------

    // app.get("/bestSelling", async (req, res) => {
    //   const result = await bestSellingAndRecentSelling
    //     .find()
    //     .sort({ count: -1 })
    //     .toArray();

    //   res.send(result);
    // });
    app.get("/bestSelling", async (req, res) => {
      try {
        // Fetch best-selling items, sort by count in descending order
        const result = await bestSellingAndRecentSelling.find().sort({ count: -1 }).toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching best-selling items:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    //  get best selling data  end by  Tonmoy---------------


    //  get recent selling data  start by Tonmoy--------------

    // app.get("/recentSelling", async (req, res) => {
    //   const result = await bestSellingAndRecentSelling
    //     .find()
    //     .sort({ purchase_date: -1 })
    //     .toArray();

    //   res.send(result);
    // });
    app.get("/recentSelling", async (req, res) => {
      try {
        // Fetch recent selling items, sort by purchase_date in descending order
        const result = await bestSellingAndRecentSelling.find().sort({ purchase_date: -1 }).toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching recent selling items:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    //  get recent selling data  end by  Tonmoy------------




    //find purchased books
    // app.get("/purchased", async (req, res) => {
    //   const email = req.query.email;
    //   // console.log(email);
    //   const query = { mail: email };
    //   const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
    //   res.send(result);
    // });
    app.get("/purchased", async (req, res) => {
      try {
        const email = req?.query?.email;
        // console.log(email);
        const query = { mail: email };
        const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching purchased items:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });




    //  post data SSLCommerz start  by Tonmoy 

    app.post('/order', async (req, res) => {

      const info = req.body;

      console.log(info, 'i')

      // console.log(info)

      const random_id = new ObjectId().toString()
      const data = {
        total_amount: info?.price,
        currency: 'BDT',
        tran_id: random_id, // use unique tran_id for each api call
        success_url: `https://book-verse-server-phi.vercel.app/payment/success/${random_id}`,
        fail_url: 'https://book-verse-server-phi.vercel.app/payment/fail',
        cancel_url: 'https://book-verse-server-phi.vercel.app/payment/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: info?.name,
        cus_email: info?.email,
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({ url: GatewayPageURL })
        // console.log('Redirecting to: ', GatewayPageURL)
      });

      //  payment success start
      app.post('/payment/success/:id', async (req, res) => {

        const tran_id = req.params.id

        const payment_details = {
          transactionId: tran_id,
          mail: info?.email,
          date: info?.date,
          books: [...info?.books],
          total_price: info?.price,
          name: info?.name,
          customer: info?.customer

        }

        const result = await paymentCollection.insertOne(payment_details)



        if (result.insertedId) {
          res.redirect(`https://book-verse-endcoders.netlify.app/SSLPaymentSuccess`)
        }


      });
      //  payment success end


      //  payment  fail stat

      app.post('/payment/fail', async (req, res) => {


        res.redirect(`https://book-verse-endcoders.netlify.app`)

      })


      //  payment fail end

      //  payment  cancel stat

      app.post('/payment/cancel', async (req, res) => {


        res.redirect(`https://book-verse-endcoders.netlify.app`)

      })


      //  payment cancel end



    });


    //  post data SSLCommerz end  by Tonmoy -----------------------------------------------



    // Real time Chat Admin to Users start by Tonmoy-------------------------------------------------------



    // post chat
    app.post('/postChat', async (req, res) => {





      try {
        const email = req?.query?.email;
        const chat = req.body;

        if (!email) {
          return res.status(400).send('Email parameter is missing');
        }

        const filter = { email: email };
        const updateDoc = {
          $set: {
            chat: chat,
          },
        };

        const options = { upsert: true };

        const updateResult = await usersCollection.updateOne(filter, updateDoc, options);

        if (updateResult.matchedCount === 0 && updateResult.upsertedCount === 0) {
          return res.status(404).send('User not found');
        }

        res.send(updateResult);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
      }


    });

    // chat Action
    app.post('/chatAction', async (req, res) => {
      try {
        const email = req?.query?.email;
        const cancel = 'cancel';



        if (!email) {
          return res.status(400).send('Email parameter is missing');
        }


        const userDocument = await usersCollection.findOne({ email });

        if (!userDocument) {
          return res.status(404).send('User not found');
        }

        const lastMessageIndex = userDocument.chat.length - 1;


        const filter = { email };
        const updateDoc = {
          $set: {
            [`chat.${lastMessageIndex}.action`]: cancel
          }
        };

        const updateResult = await usersCollection.updateOne(filter, updateDoc);

        if (updateResult.matchedCount === 0) {
          return res.status(404).send('User not found');
        }

        res.send(updateResult);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
      }
    });



    // get userdata
    app.get('/userData', async (req, res) => {





      const email = req?.query?.email;

      try {
        if (!email) {
          return res.status(400).send('Email parameter is missing');
        }

        const result = await usersCollection.findOne({ email: email });

        if (!result) {
          return res.send({ nei: 'nei' });
        }

        res.send(result);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
      }

    })





    // alluser data
    app.get('/allUserData', async (req, res) => {



      try {
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
      }

    });

    // get single user by email

    app.get('/singleUserDataByEmail/:email', async (req, res) => {




      try {

        const email = req.params.email;


        const result = await usersCollection.findOne({ email: email });


        res.send(result);
      } catch (error) {

        console.error("Error:", error);
        res.status(500).send("An error occurred while fetching user data.");
      }

    });


    // get single user data by id
    app.get('/singleUserData/:id', async (req, res) => {
      const id = req?.params?.id;

      try {
        const objectId = new ObjectId(id);

        const result = await usersCollection.findOne({ _id: objectId });
        res.send(result);
      } catch (error) {
        console.error('Error creating ObjectId:', error);
        res.status(400).send('Invalid ID format');
      }
    });






    //  Real time Chat Admin to Users end by Tonmoy----------------------------------------------------------

    //  Real time Chat User to User end by Tonmoy----------------------------------------------------------


    // create the seller And Buyer Collections 
    app.post('/sellerAndBuyerCollections', async (req, res) => {
      try {

        const { seller, buyer } = req.body;

        if (!seller || !buyer) {

          return res.status(500).json({ error: 'seller and buyer missing ' });
        }

        const info = req.body;
        console.log(info);


        const checkingInfo1 = await userToUser.findOne({ $and: [{ seller: seller }, { buyer: buyer }] });


        if (checkingInfo1) {
          console.log('checkingInfo1')
          return res.status(400).json({ error: 'A record with this seller and buyer already exists 1.' });
        }


        const checkingInfo2 = await userToUser.findOne({ $and: [{ seller: buyer }, { buyer: seller }] });


        if (checkingInfo2) {
          console.log('checkingInfo2')
          return res.status(400).json({ error: 'A record with this buyer and seller already exists 2.' });
        }


        if (!checkingInfo1 && !checkingInfo2) {
          const result = await userToUser.insertOne(info);
          console.log(result);

          return res.status(201).json({ message: 'Record created successfully.', result });
        }
      } catch (error) {
        if (error.code === 11000) {

          console.error('Duplicate key error:', error.message);
          return res.status(400).json({ error: 'A record with this seller and buyer already exists.' });
        }
        console.error('Error:', error);

        return res.status(500).json({ error: 'Internal server error' });
      }
    });


    // get data from  seller AndBuyer Collections 
    // app.get('/sellerAndBuyerCollections', async (req, res) => {

    //   const seller = req?.query?.seller
    //   const buyer = req?.query?.buyer

    //   const result1 = await userToUser.findOne({ $and: [{ seller: seller }, { buyer: buyer }] })

    //   if(result1){
    //     return res.send(result1)
    //   }

    //   const result2 = await userToUser.findOne({ $and: [{ seller: buyer }, { buyer: seller }] })

    //   return res.send(result2)

    // });
    app.get('/sellerAndBuyerCollections', async (req, res) => {
      try {
        const seller = req?.query?.seller
        const buyer = req?.query?.buyer

        const result1 = await userToUser.findOne({ $and: [{ seller: seller }, { buyer: buyer }] })

        if (result1) {
          return res.send(result1)
        }

        const result2 = await userToUser.findOne({ $and: [{ seller: buyer }, { buyer: seller }] })

        return res.send(result2)
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching seller and buyer collections:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    // post user to user
    app.post('/postChatUserToUser', async (req, res) => {



      try {
        const id = req?.query?.id;
        const chat = req.body;


        if (!id) {
          return res.status(400).send('Email parameter is missing');
        }

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            chat: chat,
          },
        };

        const options = { upsert: true };

        const updateResult = await userToUser.updateOne(filter, updateDoc, options);

        console.log(updateResult)

        if (updateResult.matchedCount === 0 && updateResult.upsertedCount === 0) {
          return res.status(404).send('User not found');
        }

        res.send(updateResult);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
      }
    }, []);

    // get all users chats

    app.get('/userAllChats', async (req, res) => {
      try {
        const email = req?.query?.email;
        if (!email) {
          throw new Error('Email is missing in the request query.');
        }

        const [userToUserResult, usersResult] = await Promise.all([
          userToUser.aggregate([
            {
              $match: {
                $or: [
                  { seller: email },
                  { buyer: email },
                ],
              },
            },
            {
              $lookup: {
                from: 'usersCollection', // Replace 'usersCollection' with the actual name of your 'users' collection
                localField: 'seller',
                foreignField: 'email',
                as: 'sellerInfo',
              },
            },
            {
              $lookup: {
                from: 'usersCollection', // Replace 'usersCollection' with the actual name of your 'users' collection
                localField: 'buyer',
                foreignField: 'email',
                as: 'buyerInfo',
              },
            },
          ]).toArray(),
          usersCollection.find({ email: email }).toArray(),
        ]);

        const mergedResult = userToUserResult.concat(usersResult);

        res.send(mergedResult);
      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
      }
    });





    //  get message user to user 
    app.get('/getMessageUserToUser', async (req, res) => {
      try {
        const id = req.query.id;


        if (!id) {
          return res.status(404).send('id not found');
        }
        const result = await userToUser.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res.status(404).send('Message not found');
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
      }
    });


    //  Real time Chat  User to User End by Tonmoy----------------------------------------------------------



    //Old Books API started by AHAD-----------------------------------

    // app.post("/oldBooks", async (req, res) => {
    //   const oldBook = req.body;
    //   // console.log(oldBook);
    //   const result = await oldBooksCollection.insertOne(oldBook);
    //   res.send(result);
    // });
    app.post("/oldBooks", async (req, res) => {
      try {
        const oldBook = req?.body;
        // console.log(oldBook);
        const result = await oldBooksCollection.insertOne(oldBook);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error adding old book:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    // app.get("/oldBooks", async (req, res) => {
    //   const result = await oldBooksCollection.find().toArray();
    //   res.send(result);
    // });
    app.get("/oldBooks", async (req, res) => {
      try {
        // Fetch old books from the collection
        const result = await oldBooksCollection.find().toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error('Error fetching old books:', error);
        res.status(500).json({ message: 'An error occurred' });
      }
    });

    // app.get("/oldBook/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const find = { _id: new ObjectId(id) };
    //   const result = await oldBooksCollection.findOne(find);
    //   res.send(result);
    // });
    app.get("/oldBook/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const find = { _id: new ObjectId(id) };
        const result = await oldBooksCollection.findOne(find);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error fetching old book:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });



    // app.get("/myBooks", async (req, res) => {
    //   const email = req.query.email;
    //   console.log("email coming", email);
    //   const query = { sellerMail: email };
    //   const result = await oldBooksCollection.find(query).toArray();
    //   res.send(result);
    // });
    app.get("/myBooks", async (req, res) => {
      try {
        const email = req?.query?.email;
        console.log("email coming", email);
        const query = { sellerMail: email };
        const result = await oldBooksCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error fetching user's books:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });

    // app.delete("/delete/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await oldBooksCollection.deleteOne(query);
    //   res.send(result);
    // });
    app.delete("/delete/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await oldBooksCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error deleting old book:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    //Old Books API end by AHAD----------------------------


    //Promo Code Api start by AHAD---------------------
    // app.post("/promo", async (req, res) => {
    //   const promoCode = req.body;
    //   // console.log(promoCode);
    //   const result = await promoCodesCollection.insertOne(promoCode);
    //   res.send(result);
    // });
    app.post("/promo", async (req, res) => {
      try {
        const promoCode = req?.body;
        // console.log(promoCode);
        const result = await promoCodesCollection.insertOne(promoCode);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error adding promo code:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    // app.get("/promo", async (req, res) => {
    //   const result = await promoCodesCollection.find().toArray();
    //   res.send(result);
    // });
    app.get("/promo", async (req, res) => {
      try {
        // Fetch promotional codes from the collection
        const result = await promoCodesCollection.find().toArray();
        res.json(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error fetching promotional codes:", error);
        res.status(500).json({ message: "An error occurred" });
      }
    });

    // app.delete("/promo/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await promoCodesCollection.deleteOne(query);
    //   res.send(result);
    // });
    app.delete("/promo/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await promoCodesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        // Handle any unexpected errors here
        console.error("Error deleting promo code:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    });


    //Promo Code API end by AHAD---------------



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