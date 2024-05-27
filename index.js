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


const userSchema = new mongoose.Schema({
    admin: String,
    password: String
  });
  const User = mongoose.model('User', userSchema);
  
  const slotSchema = new mongoose.Schema({
    date: Date,
    starttime: String,
    endtime: String,
    mode: String,
    isBooked: {
      type: Boolean,
      default: false
    }
  });
  
const Slot = mongoose.model('Slot', slotSchema);


app.post('/api/register', async (req, res) => {
    const { admin, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        admin,
        password: hashedPassword
      });
      await newUser.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/login', async (req, res) => {
    const { admin, password } = req.body;
    try {
      const user = await User.findOne({admin});
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isPasswordValid = bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
  
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});