const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
const { bannersCollection } = require("../index");

   // -------nhhasib manage banner
   router.get("/banners", async (req, res) => {
    const result = await bannersCollection.find().toArray();
    // console.log(result)
    res.send(result)
  })

  router.post("/banners", async (req, res) => {
    const newBanner = req.body;
    // console.log(newBanner)
    const result = await bannersCollection.insertOne(newBanner);
    res.send(result);
  })

  router.patch("/banner/:id", async (req, res) => {
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
    // console.log(result)
    res.send(result)
  })

  router.delete("/banner/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await bannersCollection.deleteOne(query);
    // console.log(result);
    res.send(result)
  })

  module.exports = router;

  // --------------------nhhasib end