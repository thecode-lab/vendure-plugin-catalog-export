import { Controller, Get } from '@nestjs/common';
import { Ctx, RequestContext} from '@vendure/core';
import {ProductCatalogService} from '../service/productCatalog.service';


@Controller('productcatalog')
export class ProductsCatalogController {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async findAll(@Ctx() ctx: RequestContext) {    
        return this.ProductCatalogService.readCatalogFromFile();
    } 
}

@Controller('productcatalog-init')
export class ProductsCatalogControllerInit {
    constructor(private ProductCatalogService: ProductCatalogService) {
    }
    @Get()
     async initAll(@Ctx() ctx: RequestContext) {    
        const catalog = await this.ProductCatalogService.getProductCatalogData(ctx);
 	this.ProductCatalogService.saveCatalogToFile(catalog);
        if (catalog) {
            return catalog;
        } else {
            return { message: 'Failed to initialize data.' };
        }
    } 
}



