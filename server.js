let express = require("express");
let { MongoClient, ObjectId } = require("mongodb"); // let mongodb = require("mongodb").MongoClient; as an alt. but what we used is good for multiple implementations
const dotenv = require("dotenv");
dotenv.config();
let sanitizeHTML = require("sanitize-html");

let todoApp = express();
let db; // Creating a var for mongoDB. It can be any name but db is commonly used

todoApp.use(express.static("public")); // it makes the content of that folder available to server.

// Creating the connection string
async function fastConnect() {
  let client = new MongoClient(process.env.CONNECTIONSTRING);
  await client.connect();
  db = client.db(); // it makes the db available for the global db variable
  todoApp.listen(3000);
}

fastConnect();

todoApp.use(express.json());
// Making express framework suitable for input use etc
todoApp.use(express.urlencoded({ extended: false })); // details: express.js documentation

// ===== ADDING PASSWORD PROTECTION =====

function passwordProtected(req, res, next) {
  res.set("WWW-Authenticate", "Basic realm='To-Do App & by Goktug Erol'");
  console.log(req.headers.authorization);
  if (req.headers.authorization == "Basic Z29rdHVnOm5leHRsaW5lMjAyMw==") {
    next();
  } else {
    res.status(401).send("Authentication Required");
  }
}

todoApp.use(passwordProtected); // Adding password protection to whole app and pages

todoApp.get("/", (req, res) => {
  db.collection("items")
    .find()
    .toArray((err, items) => {
      res.send(`<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>To-Do App & by Goktug Erol</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
      </head>
    <body>
      <div class="container">
        <h1 class="display-4 text-center py-1">Assignment for Nextline</h1>
        <p align="center">by Goktug Erol - ge@legacycode.dev</p>
        <div class="jumbotron p-3 shadow-sm">
          <form id="create-form" action="create-item" method="POST">
            <div class="d-flex align-items-center">
              <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
              <button class="btn btn-primary">Agregar Tarea</button>
            </div>
          </form>
        </div>
        
        <ul id="item-list" class="list-group pb-5">
        </ul>
        
      </div>

      <script>
      let items = ${JSON.stringify(items)};  // for client side rendering

      </script>

      <script src="https://unpkg.com/axios@1.1.2/dist/axios.min.js"></script>
      <script src="/browser.js"></script>
    </body>
    </html>`);
    });
});

todoApp.post("/create-item", (req, res) => {
  // Connecting to MongoDB database
  // first: collection name then crud ops
  // Adding the protection layer to avoid malicius code input
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: {},
  });
  db.collection("items").insertOne({ todo: safeText }, (err, info) => {
    res.json({ _id: info.insertedId, todo: safeText });
  });
});

todoApp.post("/update-task", (req, res) => {
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: {},
  });
  db.collection("items").findOneAndUpdate(
    { _id: new ObjectId(req.body.id) },
    { $set: { todo: safeText } },
    () => {
      res.send("Success"); // check todo text in set
    }
  );
});

todoApp.post("/delete-item", (req, res) => {
  db.collection("items").deleteOne({ _id: new ObjectId(req.body.id) }, () => {
    res.send("Sucess");
  });
});
