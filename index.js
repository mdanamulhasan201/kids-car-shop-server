const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
const corsConfig = {
  origin: "",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjjf84i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const carCollection = client.db("toyCar").collection("toys");
    // console.log(carCollection);

    // search option
    const indexKeys = { carName: 1, category: 1 };
    const indexOptions = { name: "carNameCategory" };

    const result =  carCollection.createIndex(indexKeys, indexOptions);

    // get option all car
    app.get("/allCar", async (req, res) => {
      const result = await carCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/carSearch/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await carCollection
        .find({
          $or: [
            { carName: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    // post option
    app.post("/postCar", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await carCollection.insertOne(body);
      // console.log(result);
      res.send(result);
    });

    // data update option
    app.patch("/updateCar/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      console.log(updatedCar);
      const filter = { _id: new ObjectId(id) };

      // console.log(updatedCar)
      const updatedDoc = {
        $set: {
          ...updatedCar,
        },
      };
      const result = await carCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete data option

    app.delete("/deleteCar/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await carCollection.deleteOne(filter);
      res.send(result);
    });

    // details
    app.get("/carDetails/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(updateBookData);
      const filter = { _id: new ObjectId(id) };

      const result = await carCollection.findOne(filter);
      res.send(result);
    });

    // category option
    app.get("/allCar/:text", async (req, res) => {
      // console.log(req.params.text);
      if (
        req.params.text == "Race Car" ||
        req.params.text == "Land Rover" ||
        req.params.text == "Toyota"
      ) {
        const result = await carCollection
          .find({ category: req.params.text })
          .sort({ createdAt: -1 })
          .toArray();
        return res.send(result);
      }
    });

    // my car option finding email
    app.get("/myCars/:email", async (req, res) => {
      // console.log(req.params.email);
      const result = await carCollection
        .find({ postedBy: req.params.email })
        .toArray();
      res.send(result);
    });

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

app.listen(port, () => {
  console.log(`server is running on Port: ${port}`);
});
