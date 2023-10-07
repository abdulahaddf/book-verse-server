const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
 const { oldBooksCollection } = require("../index");
  
  
  //Old Books API started by AHAD-----------------------------------

  router.post("/oldBooks", async (req, res) => {
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

  // oldBook filtering/searching start by zihad-----------
  router.get("/oldBooks", async (req, res) => {
    try {
      const search = req.query.search || "";
      const sort = req.query.sort || "default";
      let sortQuery = {};

      if (sort === "asc") {
        sortQuery = { offer_price: 1 };
      } else if (sort === "desc") {
        sortQuery = { offer_price: -1 };
      }

      const page = parseInt(req.query.page) || 1; // Current page
      const perPage = parseInt(req.query.perPage) || 10; // Items per page

      // Calculate the skip value to skip items on previous pages
      const skip = (page - 1) * perPage;

      const query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { language: { $regex: search, $options: "i" } },
          { seller: { $regex: search, $options: "i" } },
          { sellerMail: { $regex: search, $options: "i" } },
        ],
      };

      const result = await oldBooksCollection
        .find(query)
        .skip(skip)
        .limit(perPage)
        .sort(sortQuery)
        .toArray();

      res.send(result);
    } catch (error) {
      console.error("Error fetching old books:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // oldBook filtering/searching end by zihad-----------

  router.get("/oldBook/:id", async (req, res) => {
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

  router.get("/myBooks", async (req, res) => {
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

  router.delete("/delete/:id", async (req, res) => {
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
  module.exports = router;