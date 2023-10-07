const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
const { paymentCollection } = require("../index");




const SSLCommerzPayment = require("sslcommerz-lts");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY); 
 
// SSlCommerz id start key start Tonmoy

const store_id = `${process.env.SSLCOMMERZ_ID}`;
const store_passwd = `${process.env.SSLCOMMERZ_PASSWORD}`;
const is_live = false; //true for live, false for sandbox

// SSlCommerz id end key end Tonmoy
 
 // payment related api

 router.post("/payments", async (req, res) => {
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

  // payment history with sorting filtering start by zihad--------
  router.get("/paymentHistory", async (req, res) => {
    try {
      const search = req.query.search || "";
      const query = {
        $or: [
          { transactionId: { $regex: search, $options: "i" } },
          { mail: { $regex: search, $options: "i" } },
          { _id: { $regex: search, $options: "i" } },
        ],
      };

      const result = await paymentCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  // payment history with sorting filtering end by zihad--------

  // -------------- update status start by  foisal

  router.patch("/paymentStatus/:id", async (req, res) => {
    try {
      const id = req?.params?.id;
      const filter = { _id: new ObjectId(id) };
      const statusdata = req?.body;
      // const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: statusdata?.status,
        },
      };
      // console.log(id,statusdata)
      const result = await paymentCollection.updateOne(filter, updateDoc);
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error updating payment status:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  });

  // -------------- update status end by  foisal

  // revenue start by Zihad----------------------------------

  router.get("/revenueSummary", async (req, res) => {
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

  router.get("/monthlyRevenue", async (req, res) => {
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
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const formattedMonthlyRevenue = monthlyRevenue.map(
        (revenue, index) => ({
          month: months[index],
          revenue: revenue.toFixed(2),
        })
      );

      res.json(formattedMonthlyRevenue);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // monthly revenue end by Zihad----------------------------------

  // daily revenue start by Zihad----------------------------------

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  router.get("/dailyRevenue", async (req, res) => {
    try {
      const payments = await paymentCollection.find().toArray();

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const daysInMonth = new Date(
        currentYear,
        currentMonth + 1,
        0
      ).getDate();

      let dailyRevenue = {};

      payments.forEach((payment) => {
        const paymentDate = payment.date.split("T")[0];
        const [paymentYear, paymentMonth, paymentDay] =
          paymentDate.split("-");

        if (
          parseInt(paymentYear) === currentYear &&
          parseInt(paymentMonth) === currentMonth + 1
        ) {
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
          revenue: (dailyRevenue[day] || 0).toFixed(2),
        });
      }

      res.json({ dailyRevenue: formattedDailyRevenue });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // daily revenue end by Zihad----------------------------------


    //find purchased books

    router.get("/purchased", async (req, res) => {
        try {
          const email = req?.query?.email;
          // console.log(email);
          const query = { mail: email };
          const result = await paymentCollection
            .find(query)
            .sort({ date: -1 })
            .toArray();
          res.send(result);
        } catch (error) {
          // Handle any unexpected errors here
          console.error("Error fetching purchased items:", error);
          res.status(500).json({ message: "An error occurred" });
        }
      });
  
      //  post data SSLCommerz start  by Tonmoy
  
      router.post("/order", async (req, res) => {
        const info = req.body;
  
        // console.log(info)
  
        const random_id = new ObjectId().toString();
        const data = {
          total_amount: info?.price,
          currency: "BDT",
          tran_id: random_id, // use unique tran_id for each api call
          success_url: `https://book-verse-team-project-server.up.railway.app/payment/success/${random_id}`,
          fail_url: "https://book-verse-team-project-server.up.railway.app/payment/fail",
          cancel_url: "https://book-verse-team-project-server.up.railway.app/payment/cancel",
          ipn_url: "http://localhost:3030/ipn",
          shipping_method: "Courier",
          product_name: "Computer.",
          product_category: "Electronic",
          product_profile: "general",
          cus_name: info?.name,
          cus_email: info?.email,
          cus_add1: "Dhaka",
          cus_add2: "Dhaka",
          cus_city: "Dhaka",
          cus_state: "Dhaka",
          cus_postcode: "1000",
          cus_country: "Bangladesh",
          cus_phone: "01711111111",
          cus_fax: "01711111111",
          ship_name: "Customer Name",
          ship_add1: "Dhaka",
          ship_add2: "Dhaka",
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
          // console.log('Redirecting to: ', GatewayPageURL)
        });
  
        //  payment success start
        router.post("/payment/success/:id", async (req, res) => {
          const tran_id = req.params.id;
  
          const payment_details = {
            transactionId: tran_id,
            mail: info?.email,
            date: info?.date,
            books: [...info?.books],
            total_price: info?.price,
            name: info?.name,
          };
  
          const result = await paymentCollection.insertOne(payment_details);
  
          if (result.insertedId) {
            res.redirect(
              `https://book-verse-endcoders.netlify.app/SSLPaymentSuccess`
            );
          }
        });
        //  payment success end
  
        //  payment  fail stat
  
        router.post("/payment/fail", async (req, res) => {
          res.redirect(`https://book-verse-endcoders.netlify.app`);
        });
  
        //  payment fail end
  
        //  payment  cancel stat
  
        router.post("/payment/cancel", async (req, res) => {
          res.redirect(`https://book-verse-endcoders.netlify.app`);
        });
  
        //  payment cancel end
      });
  
      //  post data SSLCommerz end  by Tonmoy -----------------------------------------------
  

        // payment intent Stripe - AHAD
    router.post("/create-payment-intent", async (req, res) => {
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

      module.exports = router;