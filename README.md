# venduer-plugin-productcatalog.json
I'm developing a plugin with the goal of optimizing server performance. This plugin generates a JSON representation of the complete product catalog and exposes it through a REST API. The JSON data can be fetched in the frontend to dynamically generate sitemaps and product feeds for SEO purposes. This approach helps prevent server overload.....


# Installation
```typescript
const config: VendureConfig = {
  // ... other configurations

  plugins: [
    ProductCatalogPlugin.init({
      localPath:'../myCatalogDir', //relative to AssetUploadDir
    }),
    ....
  ],
};
```

```typescript
//if you want to use cronjobs in vendure vendure-cron-plugin

CronPlugin.init({
      cron: [
        {
          schedule: '0 */12 * * *',
          taskId: 'writeProductCatalog'  
        },
      ],
    }),

```

# APIs
http://localhost:3000/productcatalog-save to init and save catalog
http://localhost:3000/productcatalog to access the json 

# Todo
yarnpkg and npm... 

