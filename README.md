# vendure-plugin-catalog-export
The plugin automates the generation of a comprehensive JSON representation of your product catalog. This data is made accessible via a REST API endpoint, facilitating easy retrieval for frontend applications. By leveraging this JSON data, dynamic sitemaps and product feeds can be dynamically generated, enhancing your store's SEO capabilities. Additionally, this approach helps mitigate the risk of server overload, ensuring optimal performance even during peak traffic periods


# Installation

```typescript
const config: VendureConfig = {
  // ... other configurations

  plugins: [
    ProductCatalogPlugin.init({
      path:'../myCatalogDir', //relative to AssetUploadDir
    }),
    ProductCatalogPlugin, //save without path into default folder static/productcatalog
    ....
  ],
};
```


# APIs
http://localhost:3000/productcatalog-save to init and save catalog  
http://localhost:3000/productcatalog to access the json  
http://localhost:3000/productcatalogAll only list all Products. 




