const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
 const { usersCollection, verifyJWT  } = require("../index");

//  const { verifyJWT  } = require("../Modules/verifyJWT");
   
   
   
   
   // get single book id  end by Tonmoy ---------------------------------

   router.get("/users", async (req, res) => {
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

  router.get("/userinfo", async (req, res) => {
    try {
      const email = req?.query?.email;
      console.log(email);

      const query = { email: email };
      const result = await usersCollection.findOne(query);

      if (!result) {
        // If no user with the specified email is found, send a 404 Not Found response
        return res.status(404).json({ message: "User not found" });
      }

      res.send(result);
    } catch (error) {
      // Handle the error here
      console.error("Error fetching user information:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.post("/users", async (req, res) => {
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
      console.error("Error creating user:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.patch("/userinfoupdate", async (req, res) => {
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
          phoneNumber: userinfo?.phoneNumber,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
      console.log(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error updating user information:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.patch("/userpictureupdate", async (req, res) => {
    try {
      console.log("server clicked");
      const query = req?.query?.email;
      const filter = { email: query };
      const pitureinfo = req?.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          photoURL: pitureinfo?.photoURL,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
      console.log(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.delete("/users/:id", async (req, res) => {
    try {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.get("/users/admin/:email", verifyJWT, async (req, res) => {
    try {
      const email = req?.params?.email;
      if (req?.decoded?.email !== email) {
        return res.send({ admin: false });
      }
      console.log(req?.decoded?.email);
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error checking admin role:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  router.patch("/users/admin/:id", async (req, res) => {
    try {
      const id = req?.params?.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    } catch (error) {
      // Handle any unexpected errors here
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // make admin end by nahid

  module.exports = router;