const fs = require("fs");

function update(file, changes) { let s = fs.readFileSync(file, "utf8"); for (const [a, b] of changes) { if (!s.includes(a)) throw new Error("Missing anchor " + file + ": " + a);
        s = s.replace(a, b) }
    fs.writeFileSync(file, s) }
update("src/app/components/ProductGrid.tsx", [
    ['  price: number;', '  price: number;\n  sizePrices?: Record<string, number>;'],
    ['      price: product.price,\n      size,', '      price: product.sizePrices?.[size] ?? product.price,\n      size,']
]);
update("src/app/components/QuickAddModal.tsx", [
    ['<p className="qa-price">Rs. {product.price.toLocaleString()}</p>', '<p className="qa-price">Rs. {(product.sizePrices?.[size] ?? product.price).toLocaleString()}</p>']
]);
update("src/app/shop/[id]/ProductDetailClient.tsx", [
    ['  price: number;', '  price: number;\n  sizePrices?: Record<string, number>;'],
    ['  const currentPrice =\n    !isWesternFashion', '  const currentPrice =\n    product.sizePrices?.[selectedSize ?? ""] ?? (\n    !isWesternFashion'],
    ['      : product.price;\n\n  // Default view', '      : product.price);\n\n  // Default view']
]);