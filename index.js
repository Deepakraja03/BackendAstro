const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

// const corsOptions = {
//   origin: ['https://crazycars.vercel.app'],
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true, // enable set cookie
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
app.use(cors());
const dbURI = process.env.DB;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

// Parse incoming JSON data
app.use(express.json());

app.use('/', (req, res) => {
  res.send("Server running successfully");
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});