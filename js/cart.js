document.addEventListener("DOMContentLoaded", () => {
  // Select all "Shop Now" and "See More" buttons
  const buttons = document.querySelectorAll(".add-to-cart, .v, .button");

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // Find the box around the clicked button
      const box = btn.closest(".box, .box1");
      if (!box) return;

      // Get name
      const name = box.querySelector("h2, h3")?.innerText?.trim() || "Unnamed Plant";

      // Get price
      const priceText = box.querySelector(".p")?.innerText || box.innerText;
      const price = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      // Get image
      let img = box.querySelector("img")?.getAttribute("src") || "";
      if (!img) {
        const bg = box.querySelector(".box-img, .box-img1")?.style.backgroundImage;
        img = bg ? bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "") : "";
      }

      const item = { name, price, image: img };

      // Send data to backend
      fetch("http://localhost:3000/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("🛒 Item added to cart!");
          } else {
            alert("❌ Failed to add to cart.");
          }
        })
        .catch((err) => {
          console.error("❌ Error:", err);
          alert("⚠️ Something went wrong.");
        });
    });
  });
});
