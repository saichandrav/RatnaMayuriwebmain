import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

const defaults = {
  title: "Ratnamayuri | Luxury Jewellery & Premium Silk Sarees",
  description:
    "Shop handcrafted luxury jewellery and premium silk sarees at Ratnamayuri. Perfect for bridal, temple jewellery, weddings and festive collections.",
  ogImage: "https://ratnamayuri.live/og-image.jpg",
};

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
}: SEOProps) => {
  const pageTitle = title
    ? `${title} | Ratnamayuri`
    : defaults.title;
  const pageDescription = description || defaults.description;
  const pageImage = ogImage || defaults.ogImage;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />

      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
};

export default SEO;
