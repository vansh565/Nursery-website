const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const multer = require("multer");



const app = express();
const PORT = 3000;

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Images only (JPEG/JPG/PNG)!"));
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/Plantwebsite", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error", err));

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  gender: String,
  emailVerified: { type: Boolean, default: false },
  profilePicture: String
});
const User = mongoose.model("User", userSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: String,
  email: String,
  itemId: String,
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});
const Cart = mongoose.model("Cart", cartSchema);

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  userId: String,
  itemId: String,
  name: String,
  price: Number,
  image: String,
});
const WishlistItem = mongoose.model("WishlistItem", wishlistSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: String,
  email: String,
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
  }],
  totalPrice: Number,
  discount: Number,
  deliveryFee: Number,
  finalAmount: Number,
  orderDate: Date,
  status: { type: String, default: "Pending" },
  address: String,
  paymentMethod: String,
});
const Order = mongoose.model("Order", orderSchema);

// In-memory OTP store
const emailOtpStore = {};

// ORDER ROUTE
app.post("/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    const userEmail = req.body.email;
    const adminEmail = "vansh565.sharma@gmail.com";

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email is required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sanjuuppal458@gmail.com",
        pass: "mtaknqniefogwjzq",
      },
    });

    const orderSummary = order.items.map(item => `
      <li>
        <strong>${item.name}</strong> x${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}
        ${item.image ? `<br><img src="${item.image}" alt="${item.name}" style="width:100px;height:100px;object-fit:cover;" />` : ""}
      </li>
    `).join("");

    const userMailOptions = {
      from: "GreenHaven <sanjuuppal458@gmail.com>",
      to: userEmail,
      subject: "🌿 Your GreenHaven Order Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2d6a4f;">Thank You for Your Order!</h2>
          <p>Dear Customer (User ID: ${order.userId}),</p>
          <p>Your order has been successfully placed with GreenHaven. Below are the details:</p>
          <h3>Order Summary</h3>
          <ul style="list-style-type: none; padding: 0;">
            ${orderSummary}
          </ul>
          <p><strong>Total Price:</strong> ₹${order.totalPrice.toFixed(2)}</p>
          <p><strong>Discount:</strong> −₹${order.discount.toFixed(2)}</p>
          <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee.toFixed(2)}</p>
          <p><strong>Final Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
          <p><strong>Shipping Address:</strong> ${order.address || "Not provided"}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod || "Not specified"}</p>
          <p>We’ll notify you once your order is shipped. Thank you for shopping with us! 🌱</p>
          <p style="color: #555; font-size: 12px;">If you have any questions, contact us at support@greenhaven.com.</p>
        </div>
      `
    };

    const adminMailOptions = {
      from: "GreenHaven <sanjuuppal458@gmail.com>",
      to: adminEmail,
      subject: `📦 New Order Received from User ID: ${order.userId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2d6a4f;">New Order Notification</h2>
          <p>A new order has been placed with the following details:</p>
          <p><strong>User ID:</strong> ${order.userId}</p>
          <p><strong>User Email:</strong> ${userEmail}</p>
          <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
          <h3>Order Summary</h3>
          <ul style="list-style-type: none; padding: 0;">
            ${orderSummary}
          </ul>
          <p><strong>Total Price:</strong> ₹${order.totalPrice.toFixed(2)}</p>
          <p><strong>Discount:</strong> −₹${order.discount.toFixed(2)}</p>
          <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee.toFixed(2)}</p>
          <p><strong>Final Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
          <p><strong>Shipping Address:</strong> ${order.address || "Not provided"}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod || "Not specified"}</p>
          <p>Please process this order promptly.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(userMailOptions);
      console.log(`✅ Email sent to user: ${userEmail}`);
    } catch (userEmailError) {
      console.error(`❌ Failed to send email to user: ${userEmailError.message}`);
    }

    try {
      await transporter.sendMail(adminMailOptions);
      console.log(`✅ Email sent to admin: ${adminEmail}`);
    } catch (adminEmailError) {
      console.error(`❌ Failed to send email to admin: ${adminEmailError.message}`);
    }

    await Cart.deleteMany({ email: userEmail });

    res.json({ success: true, message: "Order placed successfully", orderId: order._id });
  } catch (err) {
    console.error("Order processing error:", err);
    res.status(500).json({ success: false, message: "Failed to place order", error: err.message });
  }
});

// UPDATE CART ITEM QUANTITY
app.patch("/cart/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    await Cart.findByIdAndUpdate(req.params.id, { quantity }, { new: true });
    console.log("Cart item updated:", req.params.id);
    res.json({ success: true, message: "Cart item updated" });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/cart", async (req, res) => {
  try {
    await Cart.deleteMany({});
    console.log("All cart items deleted");
    res.json({ success: true, message: "All cart items deleted" });
  } catch (err) {
    console.error("Delete cart error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/orders", async (req, res) => {
  try {
    await Order.deleteMany({});
    console.log("All orders deleted");
    res.json({ success: true, message: "All orders removed" });
  } catch (err) {
    console.error("Delete orders error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SEND EMAIL OTP
app.post("/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.log("Email missing in send-email-otp");
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  emailOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sanjuuppal458@gmail.com",
      pass: "mtaknqniefogwjzq",
    },
  });

  try {
    await transporter.sendMail({
      from: "GreenHaven <sanjuuppal458@gmail.com>",
      to: email,
      subject: "GreenHaven Email OTP",
      html: `<h3>Your OTP is:</h3><p><strong>${otp}</strong></p>`
    });
    console.log(`✅ OTP sent to ${email}`);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Send email OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
  }
});

// VERIFY EMAIL OTP
app.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  const stored = emailOtpStore[email];

  if (!stored) {
    console.log("No OTP found for email:", email);
    return res.status(400).json({ success: false, message: "No OTP found" });
  }

  if (stored.otp === otp && Date.now() < stored.expiresAt) {
    delete emailOtpStore[email];
    try {
      await User.updateOne({ email }, { emailVerified: true });
      console.log(`✅ Email verified for ${email}`);
      res.json({ success: true, message: "✅ Email verified!" });
    } catch (err) {
      console.error("Verify email OTP error:", err);
      res.status(500).json({ success: false, message: "Error updating verification status", error: err.message });
    }
  } else {
    console.log("Invalid or expired OTP for email:", email);
    res.status(400).json({ success: false, message: "❌ Invalid or expired OTP" });
  }
});

// USER STATUS
app.get("/user-status/:userId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      console.log("Invalid userId format:", req.params.userId);
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      console.log("User not found for userId:", req.params.userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log("User status fetched for userId:", req.params.userId);
    res.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error("User status error:", err);
    res.status(500).json({ success: false, message: "Error fetching user status", error: err.message });
  }
});

// UPDATE PROFILE
app.post("/api/update-profile", upload.single("profilePicture"), async (req, res) => {
  const { userId, firstName, lastName, email, gender } = req.body;
  console.log("Update profile request:", { userId, firstName, lastName, email, gender, file: req.file ? req.file.filename : "No file" });

  if (!userId || !firstName || !lastName || !email) {
    console.log("Missing required fields:", { userId, firstName, lastName, email });
    return res.status(400).json({ success: false, message: "User ID, first name, last name, and email are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Invalid userId format:", userId);
    return res.status(400).json({ success: false, message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.emailVerified) {
      console.log("Email not verified for userId:", userId);
      return res.status(400).json({ success: false, message: "Email must be verified" });
    }

    // Check for duplicate email if email is changing
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        console.log("Email already in use:", email);
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.gender = gender || user.gender;
    if (req.file) {
      user.profilePicture = `https://new-plant-1.onrender.com/uploads/${req.file.filename}`;
      console.log("Profile picture saved:", user.profilePicture);
    } else {
      console.log("No profile picture provided");
    }

    await user.save();
    console.log("Profile updated successfully for userId:", userId);

    res.json({
      success: true,
      message: "Profile updated successfully",
      profilePicture: user.profilePicture
    });
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: "Error updating profile", error: err.message });
  }
});

// SIGNUP API
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("Email already registered:", email);
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, password: hashed });
    await user.save();
    console.log("User signed up:", user._id);
    res.json({ success: true, userId: user._id });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOGIN API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Invalid email:", email);
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Incorrect password for email:", email);
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    console.log("User logged in:", user._id);
    res.json({ success: true, email: user.email, userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CART ROUTES
app.post("/cart", async (req, res) => {
  try {
    const cartItem = new Cart(req.body);
    await cartItem.save();
    console.log("Cart item added:", req.body);
    res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const items = await Cart.find({});
    res.json(items);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/cart/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    console.log("Cart item deleted:", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete cart item error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/wishlist", async (req, res) => {
  try {
    const item = new WishlistItem(req.body);
    await item.save();
    console.log("Wishlist item added:", req.body);
    res.json({ success: true, message: "Item added to wishlist!" });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ success: false, message: "Error adding item." });
  }
});

app.get("/wishlist", async (req, res) => {
  try {
    const items = await WishlistItem.find();
    res.json(items);
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/wishlist/:id", async (req, res) => {
  try {
    await WishlistItem.findByIdAndDelete(req.params.id);
    console.log("Wishlist item deleted:", req.params.id);
    res.json({ success: true, message: "Item removed from wishlist!" });
  } catch (err) {
    console.error("Delete wishlist item error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    console.log("Order deleted:", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});