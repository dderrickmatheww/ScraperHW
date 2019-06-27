const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const app = express();
const exphbs = require("express-handlebars");
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
const Router = require("./routes");

app.use(logger("dev"));

app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function(){
    console.log("Connected to Mongoose");
})
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder

app.use("/", Router);

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
