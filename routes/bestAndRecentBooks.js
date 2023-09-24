const express = require("express");
const router = express.Router();
const app = express();
const { bestSellingAndRecentSelling } = require("../index");


   // post  best selling & recent selling start by tonmoy-------------------

   router.post("/bestSellingAndRecentSelling", async (req, res) => {
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

  router.get("/bestSelling", async (req, res) => {
    try {
      // Fetch best-selling items, sort by count in descending order
      const result = await bestSellingAndRecentSelling
        .find()
        .sort({ count: -1 })
        .toArray();
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error fetching best-selling items:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  //  get best selling data  end by  Tonmoy---------------

  //  get recent selling data  start by Tonmoy--------------

  router.get("/recentSelling", async (req, res) => {
    try {
      // Fetch recent selling items, sort by purchase_date in descending order
      const result = await bestSellingAndRecentSelling
        .find()
        .sort({ purchase_date: -1 })
        .toArray();
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error fetching recent selling items:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  //  get recent selling data  end by  Tonmoy------------

  module.exports = router;