import productNecklace from "@/assets/product-necklace.jpg";
import productEarrings from "@/assets/product-earrings.jpg";
import productBangles from "@/assets/product-bangles.jpg";
import productSaree from "@/assets/product-saree.jpg";

const imageMap: Record<string, string> = {
  "product-necklace": productNecklace,
  "product-earrings": productEarrings,
  "product-bangles": productBangles,
  "product-saree": productSaree,
};

export const resolveProductImages = (images: string[]) =>
  images.map(image => {
    if (image.startsWith("asset:")) {
      const key = image.replace("asset:", "");
      return imageMap[key] || image;
    }
    return image;
  });

export const productImageOptions = Object.keys(imageMap).map(key => ({
  key,
  label: key.replace("product-", "").replace(/\b\w/g, letter => letter.toUpperCase()),
}));
