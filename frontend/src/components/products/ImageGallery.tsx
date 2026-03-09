import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const safeImages = images?.length ? images : ["/placeholder.svg"];
  const [activeIndex, setActiveIndex] = useState(0);

  const showPrevious = () => {
    setActiveIndex(prev => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const showNext = () => {
    setActiveIndex(prev => (prev + 1) % safeImages.length);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border/50">
        <img
          src={safeImages[activeIndex]}
          alt={productName}
          className="w-full h-full object-cover"
        />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label={`Previous image of ${productName}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label={`Next image of ${productName}`}
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-black/60 text-white leading-none">
              {activeIndex + 1}/{safeImages.length}
            </span>
          </>
        )}
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
