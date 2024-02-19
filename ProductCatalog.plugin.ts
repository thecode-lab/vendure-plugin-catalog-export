import {
  PluginCommonModule,
  VendurePlugin,
  Type,
} from "@vendure/core";
import * as path from "path";
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

export class ProductCatalogPlugin  {

  static localPath: string = path.join('../productcatalog');

  static init(options: ProductCatalogOptions): Type<ProductCatalogPlugin> {
    ProductCatalogPlugin.localPath = options?.localPath || this.localPath;
    return ProductCatalogPlugin;
  }

}