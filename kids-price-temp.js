const fs=require("fs");
function update(file,changes){let s=fs.readFileSync(file,"utf8");for(const [a,b] of changes){if(!s.includes(a))throw new Error("Missing anchor "+file+": "+a);s=s.replace(a,b)}fs.writeFileSync(file,s)}
update("backend/src/models/ProductModel.js",[
['const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];','const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "1Y", "2Y", "3Y", "4Y", "5Y", "6Y"];'],
['    price: { type: Number, required: true, default: 0 },','    price: { type: Number, required: true, default: 0 },\n    sizePrices: { type: mongoose.Schema.Types.Mixed, default: {} },']
]);
update("backend/src/services/cart.service.js",[
['"title images colors price stock slug",','"title images colors price sizePrices stock slug",'],
['    let price = item.productId.price ?? 0;','    let price = item.productId.sizePrices?.[item.size] ?? item.productId.price ?? 0;']
]);
update("src/app/components/ProductGrid.tsx",[
['  price: number;\n  comparePrice:','  price: number;\n  sizePrices?: Record<string, number>;\n  comparePrice:'],
['      price: product.price,\n      size,','      price: product.sizePrices?.[size] ?? product.price,\n      size,']
]);
update("src/app/components/QuickAddModal.tsx",[
['<p className="qa-price">Rs. {product.price.toLocaleString()}</p>','<p className="qa-price">Rs. {(product.sizePrices?.[size] ?? product.price).toLocaleString()}</p>']
]);
update("src/app/shop/[id]/ProductDetailClient.tsx",[
['  price: number;\n  comparePrice:','  price: number;\n  sizePrices?: Record<string, number>;\n  comparePrice:'],
['  const currentPrice =\n    !isWesternFashion','  const currentPrice =\n    product.sizePrices?.[selectedSize ?? ""] ?? (\n    !isWesternFashion'],
['      : product.price;\n\n  // Default view','      : product.price);\n\n  // Default view']
]);