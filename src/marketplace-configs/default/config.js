const config = (tenantRef) => {
  return {
    NAME: tenantRef.marketplaceName,
    SEO_TITLE: tenantRef.marketplaceName,
    COLOR_PRIMARY: "#000639",
    // this needs to be addited when in production
    DOMAIN: `https://${tenantRef.tenantId}.vqmarketplace.com`,
    PRICING_DEFAULT_CURRENCY: "EUR",
    LISTING_TIMING_MODE: "0",
    LISTINGS_VIEW_LIST: "1",
    LISTINGS_VIEW_MAP: "1",
    LISTINGS_DEFAULT_VIEW: "2", // this is the list,
    DEFAULT_LANG: "en"
  }
}

module.exports = config;

