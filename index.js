const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: ['https://astro-portfolio-beta-ten.vercel.app', 'http://localhost:3000'],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

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

const dataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  mode: { type: String, required: true },
  email: { type: String, required: true },
  isSubmitted: { type: Boolean, required: true, default: false }
});

const Data = mongoose.model('Data', dataSchema);

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
    const user = await User.findOne({ admin });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/slots', async (req, res) => {
  const { date, starttime, endtime, mode } = req.body;
  try {
    const existingSlot = await Slot.findOne({ date, starttime, endtime, mode });
    if (existingSlot) {
      return res.status(400).json({ message: 'Slot already exists for the given date and time' });
    }
    const newSlot = new Slot({ date, starttime, endtime, mode });
    await newSlot.save();
    res.status(201).json({ message: 'Slot added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/slots', async (req, res) => {
  try {
    const { date } = req.query;
    const slots = await Slot.find({
      date: {
        $gte: new Date(`${date}T00:00:00`),
        $lt: new Date(`${date}T23:59:59`)
      }
    });
    res.status(200).json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/slots/book', async (req, res) => {
  const { slotId, dataId } = req.body;
  try {
    const slot = await Slot.findById(slotId);
    const data = await Data.findById(dataId);

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Slot is already booked' });
    }

    // Mark the slot as booked
    slot.isBooked = true;
    await slot.save();

    // Mark the data as submitted
    data.isSubmitted = true;
    await data.save();

    res.status(200).json({ message: 'Slot booked successfully', slot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/data', async (req, res) => {
  try {
    const { name, phone, date, time, mode, email, isSubmitted } = req.body;

    // Save the new data document to the database
    const newData = new Data({
      name,
      phone,
      date,
      time,
      mode,
      email,
      isSubmitted,
    });
    await newData.save();

    // Send a success response back to the client
    res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    // If an error occurs, send a 500 (Internal Server Error) response
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.get('/api/latestdata', async (req, res) => {
  try {
    // Fetch the latest data entry which is not yet marked as submitted
    const latestData = await Data.findOne({ isSubmitted: false }).sort({ _id: -1 }).limit(1);
    if (!latestData) {
      return res.status(404).json({ message: 'No data found' });
    }
    res.status(200).json(latestData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});