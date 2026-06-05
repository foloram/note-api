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

app.get("/api/notes", async (req, res) => {
  try {
    const notes = await getNoteCollection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

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
