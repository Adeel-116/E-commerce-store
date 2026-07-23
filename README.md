How to add "Add to Cart" to any future page
It's always the same 3 steps:

1. Import the hook


import { useCart } from "../components/CartContext";
2. Pull out addToCart inside your component


const { addToCart } = useCart();
3. Call it on the button with the product data


<button onClick={() => addToCart({
  id: product.id,
  productName: product.name,
  brand: product.brand,
  price: product.salePrice,
  productImage: product.image,
})}>
  ADD TO CART
</button>