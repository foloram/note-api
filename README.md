# Note API

A simple REST API for managing notes built with Express.js and MongoDB.

## Features

- Create, read, and delete notes
- Store notes with title, content, and creation timestamp
- MongoDB for persistent data storage
- RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd note-api
```

2. Install dependencies:

```bash
npm install
```

## Configuration

The API connects to MongoDB at `mongodb://localhost:27017` and uses the `notes` database. Make sure MongoDB is running before starting the server.

## Running the Server

Start the server:

```bash
node api.js
```

The server will run on `http://localhost:3009`

## API Endpoints

### Get All Notes

- **GET** `/api/notes`
- Returns all notes from the database
- Response: `200 OK` with array of notes

### Get a Single Note

- **GET** `/api/notes/:id`
- Returns a specific note by ID
- Parameters: `id` (MongoDB ObjectId)
- Response: `200 OK` with note object or `404 Not Found`

### Create a Note

- **POST** `/api/notes`
- Creates a new note
- Request body:
  ```json
  {
    "title": "Note Title",
    "content": "Note content here"
  }
  ```
- Response: `201 Created` with insertion result

### Delete a Note

- **DELETE** `/api/notes/:id`
- Deletes a note by ID
- Parameters: `id` (MongoDB ObjectId)
- Response: `200 OK` with success message or `404 Not Found`

## Error Handling

- `400 Bad Request` - Missing required fields or invalid ID format
- `404 Not Found` - Note not found
- `500 Internal Server Error` - Server error during note creation

## Dependencies

- `express` - Web framework
- `mongodb` - MongoDB driver
- `cors` - CORS middleware

## License

ISC
