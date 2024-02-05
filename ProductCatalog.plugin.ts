import {
  PluginCommonModule,
  VendurePlugin,
  EventBus,
  JobQueueService,
  JobQueue,
  RequestContextService,
} from "@vendure/core";
import { CronEvent } from "vendure-cron-plugin";
import { filter } from "rxjs/operators";
import { OnApplicationBootstrap } from "@nestjs/common";
import { ProductsCatalogController,ProductsCatalogControllerInit } from "./api/productCatalog.controller";
import { ProductCatalogService } from "./service/productCatalog.service";


export interface ExampleOptions {
  enabled: boolean;
}

@VendurePlugin({
  imports: [PluginCommonModule, ],
  providers: [ProductCatalogService],
  controllers: [ProductsCatalogController, ProductsCatalogControllerInit],
})
export class ProductCatalogPlugin implements OnApplicationBootstrap {
  constructor(
    private eventBus: EventBus,
    private productCatalogService: ProductCatalogService,
    private jobQueueService: JobQueueService,
    private requestContextService: RequestContextService,
  ) {}
  private jobQueue: JobQueue<{ ctx }>;

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
          await this.productCatalogService.saveCatalogToFile(catalog);
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
