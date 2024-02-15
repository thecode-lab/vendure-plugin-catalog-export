# vendure-plugin-catalog-export
The plugin automates the generation of a comprehensive JSON representation of your product catalog. This data is made accessible via a REST API endpoint, facilitating easy retrieval for frontend applications. By leveraging this JSON data, dynamic sitemaps and product feeds can be dynamically generated, enhancing your store's SEO capabilities. Additionally, this approach helps mitigate the risk of server overload, ensuring optimal performance even during peak traffic periods


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

# Installation a CronEvent
if you want to use cronjobs in vendure use the vendure-cron-plugin and add to vendure-config

```typescript
const config: VendureConfig = {
  // ... other configurations

  plugins: [
CronPlugin.init({
      cron: [
        {
          schedule: '0 */12 * * *',
          taskId: 'writeProductCatalog'  
        },
      ],
    }),
    ....
  ],
};
```
Add the Eventlistener
```typescript
//ProductCatalog.plugin.ts
import { CronEvent } from "vendure-cron-plugin";

 // add the following code after async onApplicationBootstrap() {...}

    this.eventBus
    .ofType(CronEvent)
    .pipe(filter((event) => event.taskId === "writeProductCatalog"))
    .subscribe(async (event) => {
      const ctx = event.ctx;
      this.jobQueue.add({ ctx }, { retries: 1});
    });
```

# APIs
http://localhost:3000/productcatalog-save to init and save catalog  
http://localhost:3000/productcatalog to access the json  
http://localhost:3000/productcatalogAll only list all Products. 




