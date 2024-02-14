import { Controller, Get } from '@nestjs/common';
import { Ctx, RequestContext} from '@vendure/core';
import {ProductCatalogService} from '../service/productCatalog.service';

//read and return productcatalog from file
 @Controller('productcatalog')
 export class ProductsCatalogController {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async findAll(@Ctx() ctx: RequestContext) {    
        return this.ProductCatalogService.readCatalogFromFile();
    } 
 }

 //save enabled products to json 
@Controller('productcatalog-save')
export class ProductsCatalogControllerInit {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async initAll(@Ctx() ctx: RequestContext) {    
        const catalog = await this.ProductCatalogService.saveProductCatalogData(ctx);
        if (catalog) {
            return catalog;
        } else {
            return { message: 'Failed to initialize data.' };
        }
    } 
}

//only lists all products including the enabled
@Controller('productcatalogAll')
export class ProductsCatalogControllerAllProducts {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async initAll(@Ctx() ctx: RequestContext) {    
        return await this.ProductCatalogService.getAllProductRel(ctx);
    } 
}



