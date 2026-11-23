type ProductDescriptionProps = { description?: string };

const decodeDescription = (value: string) => value
  .replace(/<br\s*\/?\s*>/gi, "\n")
  .replace(/<\/?p[^>]*>/gi, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .trim();

const formatLegacyDescription = (value: string) => value.includes("\n") ? value : value
  .replace(/\. (Includes|Available|Please|Accessories)/g, ".\n\n$1")
  .replace(/, (?=(fabric-covered|gathered|and a front|paired with matching))/gi, "\n- ");

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const text = formatLegacyDescription(decodeDescription(description || ""));
  if (!text) return <p className="product-description-empty">No description available for this product.</p>;
  return <div className="product-description-formatted">
    {text.split(/\n+/).map((block, index) => {
      const isBullet = /^[-•]\s+/.test(block.trim());
      const content = block.trim().replace(/^[-•]\s+/, "");
      return isBullet
        ? <p className="product-description-bullet" key={`${index}-${content}`}>{content}</p>
        : <p key={`${index}-${content}`}>{content}</p>;
    })}
  </div>;
}
