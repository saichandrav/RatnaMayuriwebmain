import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const safeImages = images?.length ? images : ["/placeholder.svg"];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border/50">
        <img
          src={safeImages[activeIndex]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {safeImages.slice(0, 4).map((image, idx) => (
          <button
            key={`${image}-${idx}`}
            onClick={() => setActiveIndex(idx)}
            className={`aspect-square rounded-lg overflow-hidden border ${
              idx === activeIndex ? "border-primary" : "border-border/60"
            }`}
          >
            <img src={image} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
