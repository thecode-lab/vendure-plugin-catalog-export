# vendure-plugin-catalog-export
The plugin automates the generation of a comprehensive JSON representation of your product catalog. This data is made accessible via a REST API endpoint, facilitating easy retrieval for frontend applications. By leveraging this JSON data, dynamic sitemaps and product feeds can be dynamically generated, enhancing your store's SEO capabilities. Additionally, this approach helps mitigate the risk of server overload, ensuring optimal performance even during peak traffic periods


# Installation

## npm
```
npm install vendure-plugin-catalog-export
```
## vendure config
```typescript
const config: VendureConfig = {
  // ... other configurations

  plugins: [
    ProductCatalogPlugin.init({
      localPath:'../myCatalogDir', //relative to AssetUploadDir
    }),
    ProductCatalogPlugin, //save without localPath into default folder static/productcatalog
    ...
  ],
};
```

# APIs
http://localhost:3000/productcatalog-save to init and save catalog  
http://localhost:3000/productcatalog to access the json  
http://localhost:3000/productcatalogAll only list all Products. 

# Example output
## JSON
```json
{
  "productCatalog": {
    "1": {
      "id": 1,
      "name": "Laptop",
      "slug": "laptop",
      "updatedAt": "2023-11-12T12:10:32.773Z",
      "facetValues": [
          {
              "name": "Electronics",
              "code": "electronics",
              "facet": {
                  "code": "category",
                  "name": "Category"
              }
          },
        "..."
      ],
      "assets": [
          {
              "preview": "preview/71/derick-david-409858-unsplash__preview.jpg",
              "source": "source/b6/derick-david-409858-unsplash.jpg"
          }
      ],
      "featuredAsset": {
          "preview": "preview/71/derick-david-409858-unsplash__preview.jpg",
          "source": "source/b6/derick-david-409858-unsplash.jpg",
          "name": "derick-david-409858-unsplash.jpg"
      },
      "optionsGroups": [
          {
              "id": 1,
              "code": "laptop-screen-size",
              "name": "screen size"
          },
          "..."
      ],
      "variants": [
          {
              "id": 1,
              "priceWithTax": 0,
              "outOfStockThreshold": 0,
              "sku": "L2201308",
              "name": "Laptop 13 inch 8GB",
              "assets": [],
              "featuredAsset": {},
              "options": [
                  {
                      "code": "13-inch",
                      "name": "13 inch"
                  },
                  {
                      "code": "8gb",
                      "name": "8GB"
                  }
              ]
          },
          "..."
      ]
  },
  "..."
}
```

## Sitemap generator
In this example we use the package remix-sitemap 
```typescript
export const sitemap: SitemapFunction = async () => {
  const res = await fetch("http://localhost:3001/productcatalog");
  const data = await res.json();
  const allProducts = data.productCatalog;
  const sitemapProducts = [];
  for (const productId in allProducts) {
    if (allProducts.hasOwnProperty(productId)) {
      const product = allProducts[productId];
      sitemapProducts.push({
        slug: product.slug,
        updatedAt: product.updatedAt,
      });
    }
  }
  if (Array.isArray(sitemapProducts)) {
    const sitemapData = sitemapProducts.map((product) => ({
      loc: `/products/${product.slug}`,
      lastmod: product.updatedAt,
      changefreq: 'weekly',
      priority: 0.8,
    }));
    return sitemapData;
  } else {
    console.error('No "products" array found in the API response');
  }
};
```








