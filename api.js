const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
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
    const search = String(req.query.search || "");
    const filter = String(req.query.filter || "");
    const tag = String(req.query.tag || "");

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    const filters = [];

    if (search.trim()) {
      filters.push({
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
          {
            tags: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      });
    }

    if (filter === "favorites") {
      filters.push({
        favorite: true,
      });
    }

    if (filter === "pinned") {
      filters.push({
        pinned: true,
      });
    }

    if (tag.trim()) {
      filters.push({
        tags: tag,
      });
    }

    const mongoFilter =
      filters.length > 0
        ? {
            $and: filters,
          }
        : {};

    const notes = await getNoteCollection()
      .find(mongoFilter)
      .sort({
        pinned: -1,
        updatedAt: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await getNoteCollection().countDocuments(mongoFilter);

    res.json({
      notes,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

//  POST - creates a new resource with the data provided in the request body. If the request body is missing required fields, it should return a 400 Bad Request status.

app.post("/api/notes", async (req, res) => {
  try {
    const {
      title = "",
      content = "",
      tags = [],
      favorite = false,
      pinned = false,
    } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        message: "tags must be an array",
      });
    }

    if (typeof favorite !== "boolean") {
      return res.status(400).json({
        message: "favorite must be a boolean",
      });
    }

    if (typeof pinned !== "boolean") {
      return res.status(400).json({
        message: "pinned must be a boolean",
      });
    }

    const result = await getNoteCollection().insertOne({
      title,
      content,
      tags,
      favorite,
      pinned,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      id: result.insertedId,
      title,
      content,
      tags,
      favorite,
      pinned,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
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

    const {
      title = "",
      content = "",
      tags = [],
      favorite = false,
      pinned = false,
    } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        message: "tags must be an array",
      });
    }

    if (typeof favorite !== "boolean") {
      return res.status(400).json({
        message: "favorite must be a boolean",
      });
    }

    if (typeof pinned !== "boolean") {
      return res.status(400).json({
        message: "pinned must be a boolean",
      });
    }

    const result = await getNoteCollection().updateOne(
      { _id: id },
      {
        $set: {
          title,
          content,
          tags,
          favorite,
          pinned,
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

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No data provided" });
    }

    const updateData = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }

    if (req.body.content !== undefined) {
      updateData.content = req.body.content;
    }

    if (req.body.tags !== undefined) {
      if (!Array.isArray(req.body.tags)) {
        return res.status(400).json({
          message: "tags must be an array",
        });
      }

      updateData.tags = req.body.tags;
    }

    if (req.body.favorite !== undefined) {
      if (typeof req.body.favorite !== "boolean") {
        return res.status(400).json({
          message: "favorite must be a boolean",
        });
      }

      updateData.favorite = req.body.favorite;
    }

    if (req.body.pinned !== undefined) {
      if (typeof req.body.pinned !== "boolean") {
        return res.status(400).json({
          message: "pinned must be a boolean",
        });
      }

      updateData.pinned = req.body.pinned;
    }

    updateData.updatedAt = new Date();

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

    res.json({
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid note ID",
    });
  }
});
