import { Controller, Get } from '@nestjs/common';
import { Ctx, Permission, RequestContext, Allow} from '@vendure/core';
import {ProductCatalogService} from '../service/productCatalog.service';

//read and return productcatalog from file
 @Controller('productcatalog')
 export class ProductsCatalogController {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async readFromFile() {  
        const catalog = await this.ProductCatalogService.readCatalogFromFile();
        if(catalog){
            return catalog;
        }
    } 
 }

 //save enabled products to json 
@Controller('productcatalog-save')
export class ProductsCatalogControllerInit {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
    @Allow(Permission.Authenticated)
     async writeCatalogToFile() {    
        const result = await this.ProductCatalogService.saveCatalogToFile();
        return result ;
    } 
}

//only lists all products including the enabled
@Controller('productcatalogAll')
export class ProductsCatalogControllerAllProducts {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
    @Allow(Permission.Authenticated)
     async getAllProducts(@Ctx() ctx: RequestContext) {    
        return await this.ProductCatalogService.getAllProductRel(ctx);
    } 
}



