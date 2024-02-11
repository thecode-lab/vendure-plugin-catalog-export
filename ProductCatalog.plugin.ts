import {
  PluginCommonModule,
  VendurePlugin,
  EventBus,
  JobQueueService,
  JobQueue,
  RequestContextService,
  Type,
} from "@vendure/core";
import * as path from "path";
import { CronEvent } from "vendure-cron-plugin";
import { filter } from "rxjs/operators";
import { OnApplicationBootstrap } from "@nestjs/common";
import { ProductsCatalogController, ProductsCatalogControllerInit, ProductsCatalogControllerAllProducts } from "./api/productCatalog.controller";
import { ProductCatalogService } from "./service/productCatalog.service";

export interface ProductCatalogOptions {
  localPath?: string; 
}

@VendurePlugin({
  imports: [PluginCommonModule], 
  providers: [ProductCatalogService],
  controllers: [ProductsCatalogController, ProductsCatalogControllerInit, ProductsCatalogControllerAllProducts],
  configuration: config =>{
    config.assetOptions.assetStorageStrategy.init;
    return config;
  }
})

export class ProductCatalogPlugin implements OnApplicationBootstrap {
  constructor(
    private eventBus: EventBus,
    private productCatalogService: ProductCatalogService,
    private jobQueueService: JobQueueService,
    private requestContextService: RequestContextService,
  ) {}
  private jobQueue: JobQueue<{ ctx }>;
  static localPath: string = path.join('../productcatalog');

  static init(options: ProductCatalogOptions): Type<ProductCatalogPlugin> {
    ProductCatalogPlugin.localPath = options?.localPath || this.localPath;
    return ProductCatalogPlugin;
  }

  async onApplicationBootstrap() {

    this.jobQueue = await this.jobQueueService.createQueue({
      name: "writeProductCatalog",
      process: async (job) => {
         
         const ctx = await this.requestContextService.create({
            apiType: 'shop',
            channelOrToken: '1',
          });

        try {
          const catalog = await this.productCatalogService.getProductCatalogData(ctx);
        } catch (error) {
          throw error;
        }         
      }
    });


    this.eventBus
    .ofType(CronEvent)
    .pipe(filter((event) => event.taskId === "writeProductCatalog"))
    .subscribe(async (event) => {
      const ctx = event.ctx;
      this.jobQueue.add({ ctx }, { retries: 1});
    });
  }  
}
