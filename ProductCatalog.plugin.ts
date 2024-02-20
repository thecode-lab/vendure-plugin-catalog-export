import {
  PluginCommonModule,
  VendurePlugin,
  Type,
} from "@vendure/core";
import * as path from "path";
import { ProductsCatalogController, ProductsCatalogControllerInit, ProductsCatalogControllerAllProducts } from "./api/productCatalog.controller";
import { ProductCatalogService } from "./service/productCatalog.service";

export interface ProductCatalogOptions {
  path?: string; 
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

  static path: string = '../productcatalog';

  static init(options: ProductCatalogOptions): Type<ProductCatalogPlugin> {
    ProductCatalogPlugin.path = options?.path || this.path;
    return ProductCatalogPlugin;
  }

}