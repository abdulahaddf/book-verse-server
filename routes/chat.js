const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
const { userToUser, usersCollection } = require("../index");







// Real time Chat Admin to Users start by Tonmoy-------------------------------------------------------

    // post chat
    router.post("/postChat", async (req, res) => {
        try {
          const email = req?.query?.email;
          const chat = req.body;
  
          if (!email) {
            return res.status(400).send("Email parameter is missing");
          }
  
          const filter = { email: email };
          const updateDoc = {
            $set: {
              chat: chat,
            },
          };
  
          const options = { upsert: true };
  
          const updateResult = await usersCollection.updateOne(
            filter,
            updateDoc,
            options
          );
  
          if (
            updateResult.matchedCount === 0 &&
            updateResult.upsertedCount === 0
          ) {
            return res.status(404).send("User not found");
          }
  
          res.send(updateResult);
        } catch (error) {
          console.error("Error:", error);
          res.status(500).send("An error occurred");
        }
      });
  
      // chat Action
      router.post("/chatAction", async (req, res) => {
        try {
          const email = req?.query?.email;
          const cancel = "cancel";
  
          if (!email) {
            return res.status(400).send("Email parameter is missing");
          }
  
          const userDocument = await usersCollection.findOne({ email });
  
          if (!userDocument) {
            return res.status(404).send("User not found");
          }
  
          const lastMessageIndex = userDocument.chat.length - 1;
  
          const filter = { email };
          const updateDoc = {
            $set: {
              [`chat.${lastMessageIndex}.action`]: cancel,
            },
          };
  
          const updateResult = await usersCollection.updateOne(filter, updateDoc);
  
          if (updateResult.matchedCount === 0) {
            return res.status(404).send("User not found");
          }
  
          res.send(updateResult);
        } catch (error) {
          console.error("Error:", error);
          res.status(500).send("An error occurred");
        }
      });
  
      // get userdata
      router.get("/userData", async (req, res) => {
        const email = req?.query?.email;
  
        try {
          if (!email) {
            return res.status(400).send("Email parameter is missing");
          }
  
          const result = await usersCollection.findOne({ email: email });
  
          if (!result) {
            return res.send({ nei: "nei" });
          }
  
          res.send(result);
        } catch (error) {
          console.error("Error:", error);
          res.status(500).send("An error occurred");
        }
      });
  
      // alluser data
      router.get("/allUserData", async (req, res) => {
        try {
          const result = await usersCollection.find().toArray();
          res.send(result);
        } catch (error) {
          console.error("Error:", error);
          res.status(500).send("An error occurred");
        }
      });
  
      // get single user by email
  
      router.get("/singleUserDataByEmail/:email", async (req, res) => {
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
      router.get("/singleUserData/:id", async (req, res) => {
        const id = req?.params?.id;
  
        try {
          const objectId = new ObjectId(id);
  
          const result = await usersCollection.findOne({ _id: objectId });
          res.send(result);
        } catch (error) {
          console.error("Error creating ObjectId:", error);
          res.status(400).send("Invalid ID format");
        }
      });
  
      //  Real time Chat Admin to Users end by Tonmoy----------------------------------------------------------
  


      //  Real time Chat User to User end by Tonmoy----------------------------------------------------------

    // create the seller And Buyer Collections
    router.post("/sellerAndBuyerCollections", async (req, res) => {
        try {
          const { seller, buyer } = req.body;
  
          if (!seller || !buyer) {
            return res.status(500).json({ error: "seller and buyer missing " });
          }
  
          const info = req.body;
          console.log(info);
  
          const checkingInfo1 = await userToUser.findOne({
            $and: [{ seller: seller }, { buyer: buyer }],
          });
  
          if (checkingInfo1) {
            console.log("checkingInfo1");
            return res.status(400).json({
              error: "A record with this seller and buyer already exists 1.",
            });
          }
  
          const checkingInfo2 = await userToUser.findOne({
            $and: [{ seller: buyer }, { buyer: seller }],
          });
  
          if (checkingInfo2) {
            console.log("checkingInfo2");
            return res.status(400).json({
              error: "A record with this buyer and seller already exists 2.",
            });
          }
  
          if (!checkingInfo1 && !checkingInfo2) {
            const result = await userToUser.insertOne(info);
            console.log(result);
  
            return res
              .status(201)
              .json({ message: "Record created successfully.", result });
          }
        } catch (error) {
          if (error.code === 11000) {
            console.error("Duplicate key error:", error.message);
            return res.status(400).json({
              error: "A record with this seller and buyer already exists.",
            });
          }
          console.error("Error:", error);
  
          return res.status(500).json({ error: "Internal server error" });
        }
      });
  
      // get data from  seller AndBuyer Collections
  
      // });
      router.get("/sellerAndBuyerCollections", async (req, res) => {
        try {
          const seller = req?.query?.seller;
          const buyer = req?.query?.buyer;
  
          const result1 = await userToUser.findOne({
            $and: [{ seller: seller }, { buyer: buyer }],
          });
  
          if (result1) {
            return res.send(result1);
          }
  
          const result2 = await userToUser.findOne({
            $and: [{ seller: buyer }, { buyer: seller }],
          });
  
          return res.send(result2);
        } catch (error) {
          // Handle any unexpected errors here
          console.error("Error fetching seller and buyer collections:", error);
          res.status(500).json({ message: "An error occurred" });
        }
      });
  
      // post user to user
      router.post(
        "/postChatUserToUser",
        async (req, res) => {
          try {
            const id = req?.query?.id;
            const chat = req.body;
  
            if (!id) {
              return res.status(400).send("Email parameter is missing");
            }
  
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
              $set: {
                chat: chat,
              },
            };
  
            const options = { upsert: true };
  
            const updateResult = await userToUser.updateOne(
              filter,
              updateDoc,
              options
            );
  
            console.log(updateResult);
  
            if (
              updateResult.matchedCount === 0 &&
              updateResult.upsertedCount === 0
            ) {
              return res.status(404).send("User not found");
            }
  
            res.send(updateResult);
          } catch (error) {
            console.error("Error:", error);
            res.status(500).send("An error occurred");
          }
        },
        []
      );
  
      // get all users chats
  
      router.get("/userAllChats", async (req, res) => {
        try {
          const email = req?.query?.email;
          if (!email) {
            throw new Error("Email is missing in the request query.");
          }
  
          const [userToUserResult, usersResult] = await Promise.all([
            userToUser
              .aggregate([
                {
                  $match: {
                    $or: [{ seller: email }, { buyer: email }],
                  },
                },
                {
                  $lookup: {
                    from: "usersCollection", // Replace 'usersCollection' with the actual name of your 'users' collection
                    localField: "seller",
                    foreignField: "email",
                    as: "sellerInfo",
                  },
                },
                {
                  $lookup: {
                    from: "usersCollection", // Replace 'usersCollection' with the actual name of your 'users' collection
                    localField: "buyer",
                    foreignField: "email",
                    as: "buyerInfo",
                  },
                },
              ])
              .toArray(),
            usersCollection.find({ email: email }).toArray(),
          ]);
  
          const mergedResult = userToUserResult.concat(usersResult);
  
          res.send(mergedResult);
        } catch (error) {
          console.error("Error:", error.message);
          res.status(500).send("Internal Server Error");
        }
      });
  
      //  get message user to user
      router.get("/getMessageUserToUser", async (req, res) => {
        try {
          const id = req.query.id;
  
          if (!id) {
            return res.status(404).send("id not found");
          }
          const result = await userToUser.findOne({ _id: new ObjectId(id) });
  
          if (!result) {
            return res.status(404).send("Message not found");
          }
  
          res.send(result);
        } catch (error) {
          console.error(error);
          res.status(500).send("Server Error");
        }
      });








      //  Real time Chat  User to User End by Tonmoy----------------------------------------------------------
      module.exports = router;