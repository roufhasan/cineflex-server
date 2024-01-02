const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gc5eeuu.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const watchListCollection = client.db("cineFlexDb").collection("watchlist");

    // watchlist collection api's
    app.get("/watchlist", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }

      const query = { email: email };
      const watchlist = await watchListCollection.find(query).toArray();
      res.send(watchlist);
    });

    app.post("/watchlist", async (req, res) => {
      const watchListItem = req.body;
      const query = {
        tmdbId: watchListItem.tmdbId,
        email: watchListItem.email,
        media_type: watchListItem.media_type,
        $or: [
          { tmdbId: watchListItem.tmdbId },
          { email: watchListItem.email.toLowerCase() },
          { media_type: watchListItem.media_type.toLowerCase() },
        ],
      };

      const existingItem = await watchListCollection.findOne(query);
      if (existingItem) {
        return res.send({ message: "already exists" });
      }

      const result = await watchListCollection.insertOne(watchListItem);
      res.send(result);
    });

    app.delete("/watchlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await watchListCollection.deleteOne(query);
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

app.get("/", (req, res) => {
  res.send("CineFlex server is running.");
});

app.listen(port, () => {
  console.log(`CineFlex server is running on port ${port}`);
});
