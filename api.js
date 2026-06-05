const express = require("express");
const app = express();

app.use(express.json());

const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017");

const PORT = 3009;

async function ConnectDB() {
  await client.connect();
  console.log("MongoDB connected");
}

ConnectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const getNoteCollection = () => {
  const db = client.db("notes");
  const noteCollection = db.collection("notes");
  return noteCollection;
};

app.get("/api/notes/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);

    const note = await getNoteCollection().findOne({ _id: id });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    res.status(400).json({ message: "Invalid note ID" });
  }
});

//  POST - creates a new resource with the data provided in the request body. If the request body is missing required fields, it should return a 400 Bad Request status.

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "title and content required" });
    }

    const result = await getNoteCollection().insertOne({
      title,
      content,
      createdAt: new Date(),
    });

    res.status(201).json({
      id: result.insertedId,
      title,
      content,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//  DELETE - removes the resource identified by the URL. If the resource does not exist, it should return a 404 Not Found status.

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await getNoteCollection().deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid note ID" });
  }
});

//  PUT - replaces the entire resource with the new data provided in the request body. If any fields are missing in the request body, they will be removed from the resource.

app.put("/api/notes/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "title and content required",
      });
    }

    const result = await getNoteCollection().updateOne(
      { _id: id },
      {
        $set: {
          title,
          content,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json({
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid note ID",
    });
  }
});

//  SEARCH AND PAGINATION

app.get("/api/notes", async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            {
              title: {
                $regex: search,
                $options: "i",
              },
            },
            {
              content: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const notes = await getNoteCollection()
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await getNoteCollection().countDocuments(filter);

    res.json({
      notes,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// PATH METHODS - allows partial updates to a resource, while PUT requires the entire resource to be sent in the request body.

app.patch("/api/notes/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await getNoteCollection().updateOne(
      { _id: id },
      {
        $set: updateData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No data provided" });
    }

    res.json({
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid note ID",
    });
  }
});
