const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
const { allBooksCollections } = require("../index");


router.get("/allBooks", async (req, res) => {
    const { sort, order, page, itemsPerPage, category } = req.query;

    const search = req.query.search || "";
    const query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { language: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ],
    };

    if (category && category !== "default") {
      query.category = category;
    }

    let sortOptions = {};

    if (sort) {
      if (sort === "real_price") {
        if (order === "asc") {
          sortOptions = { real_price: 1 };
        } else if (order === "desc") {
          sortOptions = { real_price: -1 };
        }
      } else if (sort === "rating") {
        if (order === "asc") {
          sortOptions = { rating: 1 };
        } else if (order === "desc") {
          sortOptions = { rating: -1 };
        }
      }
    }

    const options = {
      skip: (page - 1) * itemsPerPage,
      limit: parseInt(itemsPerPage),
    };

    try {
      const result = await allBooksCollections
        .find(query, options)
        .sort(sortOptions)
        .toArray();
      res.json(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching books." });
    }
  });


    // ---get all books  start by Tonmoy and filtering by Zihad----

    router.get("/allBooks", async (req, res) => {
        const { sort, order, page, itemsPerPage, category } = req.query;
  
        const search = req.query.search || "";
        const query = {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { author: { $regex: search, $options: "i" } },
            { language: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        };
  
        if (category && category !== "default") {
          query.category = category;
        }
  
        let sortOptions = {};
  
        if (sort) {
          if (sort === "real_price") {
            if (order === "asc") {
              sortOptions = { real_price: 1 };
            } else if (order === "desc") {
              sortOptions = { real_price: -1 };
            }
          } else if (sort === "rating") {
            if (order === "asc") {
              sortOptions = { rating: 1 };
            } else if (order === "desc") {
              sortOptions = { rating: -1 };
            }
          }
        }
  
        const options = {
          sort: sortOptions,
          skip: (page - 1) * itemsPerPage,
          limit: parseInt(itemsPerPage),
        };
  
        try {
          const result = await allBooksCollections.find(query, options).toArray();
          res.json(result);
        } catch (error) {
          console.error("Error fetching books:", error);
          res
            .status(500)
            .json({ error: "An error occurred while fetching books." });
        }
      });
  
      //------ get all books  end by Tonmoy and filtering by Zihad-------
  
          //review api - AHAD
    router.post("/add-review", async (req, res) => {
        const { bookId, name, photo, rating, review, identifier, postDate } =
          req.body;
        console.log(bookId);
        try {
          const existingReview = await allBooksCollections.findOne({
            $and: [
              { _id: new ObjectId(bookId) },
              { "review.identifier": identifier },
            ],
          });
  
          if (existingReview) {
            return res
              .status(400)
              .json({ message: "You have already reviewed this book" });
          }
  
          const updatedBook = await allBooksCollections.findOneAndUpdate(
            { _id: new ObjectId(bookId) },
            {
              $push: {
                review: { name, photo, rating, review, identifier, postDate },
              },
            },
            { returnOriginal: false }
          );
  
          if (!updatedBook.value) {
            return res.status(404).json({ message: "Book not found" });
          }
  
          return res.json({
            message: "Review added successfully",
            book: updatedBook.value,
          });
        } catch (error) {
          console.error("Error adding review:", error);
          return res.status(500).json({ message: "An error occurred" });
        }
      });
  
      router.get("/singleBook/:id", async (req, res) => {
        const id = req?.params?.id;
  
        try {
          const find = { _id: new ObjectId(id) };
  
          const result = await allBooksCollections.findOne(find);
  
          if (!result) {
            // If no book with the specified ID is found, send a 404 Not Found response
            return res.status(404).json({ message: "Book not found" });
          }
  
          res.send(result);
        } catch (error) {
          // Handle the error here
          console.error("Error fetching single book:", error);
          res.status(500).json({ message: "An error occurred" });
        }
      });

      
    router.post("/allBooks", async (req, res) => {
        try {
          const newBook = req?.body;
          // console.log(newBook);
          const result = await allBooksCollections.insertOne(newBook);
          res.send(result);
        } catch (error) {
          // Handle any unexpected errors here
          console.error("Error adding a new book:", error);
          res.status(500).json({ message: "An error occurred" });
        }
      });
  
      //------------------ Post method end by Zihad------------------
  
      //------------------ Update method start by Zihad------------------
  
      router.put("/allBooks/:id", async (req, res) => {
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
  
      router.delete("/allBooks/:id", async (req, res) => {
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

      module.exports = router;