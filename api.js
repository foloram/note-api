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

ConnectDB();

const getNoteCollection = () => {
  const db = client.db("notes");
  const noteCollection = db.collection("notes");
  return noteCollection;
};

app.get("/api/notes", async (req, res) => {
  const notes = getNoteCollection();
  const foundNotes = await notes.find();
  res.json(await foundNotes.toArray());
});

app.get("/api/notes/:id", async (req, res) => {
  const id = new ObjectId(req.params.id);
  const notes = await getNoteCollection().findOne({ _id: id });

  if (!notes) {
    return res.status(404).json({ message: "Note not found" });
  }

  res.status(200).json(notes);
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

    res.status(201).json(result);
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

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
