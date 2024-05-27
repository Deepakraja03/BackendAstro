const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
    starttime: String,  // Ensure field name matches
    endtime: String,    // Ensure field name matches
    mode: String,
    isBooked: {
      type: Boolean,
      default: false
    }
  });
  
  const Slot = mongoose.model('Slot', slotSchema);
  

  app.post('/api/slots', async (req, res) => {
    const { date, starttime, endtime, mode } = req.body;
  
    try {
      // Check if a slot already exists for the given date and time
      const existingSlot = await Slot.findOne({ date, starttime, endtime, mode });
  
      if (existingSlot) {
        return res.status(400).json({ message: 'Slot already exists for the given date and time' });
      }
  
      // Create a new slot if no existing slot is found
      const newSlot = new Slot({
        date,
        starttime, 
        endtime,
        mode
      });
  
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
      const slots = await Slot.find({ date: { $gte: new Date(`${date}T00:00:00`), $lt: new Date(`${date}T23:59:59`) } });
      res.status(200).json(slots);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.put('/api/slots/book/:slotId', async (req, res) => {
    const { slotId } = req.params;
  
    try {
      const slot = await Slot.findById(slotId);
  
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }
  
      if (slot.isBooked) {
        return res.status(400).json({ message: 'Slot is already booked' });
      }
  
      slot.isBooked = true;
      const updatedSlot = await slot.save();
  
      res.status(200).json({ message: 'Slot booked successfully', slot: updatedSlot });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});