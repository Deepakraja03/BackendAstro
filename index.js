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

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));


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

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  category: { type: String }, // Add category field
  createdAt: { type: Date, default: Date.now },
});
const Blog = mongoose.model('Blog', blogSchema);


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

app.get('/getData', async (req, res) => {
  try {
    const data = await Data.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use((err, req, res, next) => {
  if (err.status === 413) { // 413: Payload Too Large
    return res.status(413).json({ message: 'Payload too large. Please upload a smaller file.' });
  }
  next(err);
});


app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/blogs', async (req, res) => {
  const { title, content, image, category } = req.body; // Include image

  const newBlog = new Blog({ title, content, image, category });

  try {
    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const blogs = await Blog.find();
    const categories = [...new Set(blogs.map(blog => blog.category).filter(Boolean))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update route to filter blogs by category
app.get('/api/blogsfilter', async (req, res) => {
  try {
    const { search, category } = req.query;

    // Create a filter object based on category
    const filter = category ? { category } : {};

    // If a search term is provided, add a title/content regex search to the filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } }, // Case-insensitive search on title
        { content: { $regex: search, $options: 'i' } } // Case-insensitive search on content
      ];
    }

    // Fetch blogs based on the constructed filter
    const blogs = await Blog.find(filter);

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true }
});

const Category = mongoose.model('Category', categorySchema);

app.post('/add-category', async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    // Check if the category already exists
    const existingCategory = await Category.findOne({ name: category });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create a new category
    const newCategory = new Category({ name: category });
    await newCategory.save();

    res.status(201).json({ message: 'Category added successfully' });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/getcategories', async (req, res) => {
  try {
    const cat = await Category.find();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/', async(req,res) => {
  res.send('Backend is working');
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});