
const orderSchema = new mongoose.Schema({
  userId: String,
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
});
const Order = mongoose.model("Order", orderSchema);
