import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  ProductService,
  RequestContext,
  ID,
  ConfigService,
  JobQueue,
  JobQueueService,
  RequestContextService,
  Logger,
} from "@vendure/core";
import * as path from "path";
import { ProductCatalogPlugin } from "../ProductCatalog.plugin";
import { Readable } from "stream";
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ErrorResult } from "@vendure/core/dist/common/error/generated-graphql-shop-errors";

function capitalizeFirstLetter(input: string): string {
  return input
    .split(/[\s\-_&+]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

async function streamToJson(stream: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    stream.on("data", (chunk: any) => {
      data += chunk.toString();
    });
    stream.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    });
    stream.on("error", (error: Error) => {
      reject(error);
    });
  });
}

@Injectable()
export class ProductCatalogService {
  constructor(
    private productService: ProductService,
    private configService: ConfigService,
    private jobQueueService: JobQueueService,
    private requestContextService: RequestContextService,
  ) {}

  private saveCatalogJobQueue: JobQueue;

  private readonly filePath = path.join(
    ProductCatalogPlugin.path,
    "productcatalog.json"
  );



  async onModuleInit() {
    this.saveCatalogJobQueue = await this.jobQueueService.createQueue({
      name: "save-product-catalog",
      process: async (job) => {
        const ctx = await this.requestContextService.create({
          apiType: 'shop',
          channelOrToken: '1',
        });

        try {
          
          const batchSize = 100;
          let offset = 0;
          const undefindedVariants: { variantId: ID; productName: string }[] =
            [];
          const assetStorageStrategy =
            this.configService.assetOptions.assetStorageStrategy;
          const catalogStream = new Readable({ encoding: "binary" });

          catalogStream._read = function (size) {};
          catalogStream.push('{\n "productCatalog": {');

          while (true) {
            const productsBatch = await this.productService.findAll(
              ctx,
              { skip: offset, take: batchSize },
              [
                "variants",
                "variants.options",
                "optionGroups",
                "assets",
                "featuredAsset",
                "facetValues",
                "facetValues.facet",
                "variants.featuredAsset",
                "variants.assets",
              ]
            );

            if (productsBatch.items.length === 0) {
              break;
            }

            const nextProductsBatch = await this.productService.findAll(ctx, {
              skip: offset + batchSize,
              take: batchSize,
            });

            productsBatch.items.forEach((product, index) => {
              const { id, name, slug, updatedAt, customFields, variants } =
                product;
              if (!product.enabled) {
                return;
              }
              const selectedProductCatalog = {
                id,
                name,
                slug,
                updatedAt,
                customFields,
                facetValues: product.facetValues
                  ? product.facetValues
                      .filter((facetValue) => !facetValue.facet.isPrivate)
                      .map((facetValue) => ({
                        name: capitalizeFirstLetter(facetValue.name),
                        code: facetValue.code,
                        facet: {
                          code: facetValue.facet.code,
                          name: capitalizeFirstLetter(facetValue.facet.name),
                        },
                      }))
                  : [],
                assets: product.assets
                  ? product.assets.map((asset) => ({
                      preview: asset.asset.preview,
                      source: asset.asset.source,
                    }))
                  : [],
                featuredAsset: {
                  preview: product.featuredAsset?.preview,
                  source: product.featuredAsset?.source,
                  name: product.featuredAsset?.name,
                },
                optionsGroups: product.optionGroups
                  ? product.optionGroups.map((optionGroup) => ({
                      id: optionGroup.id,
                      code: optionGroup.code,
                      name: optionGroup.translations.find(
                        (translation) =>
                          translation.languageCode == ctx.languageCode
                      )?.name,
                    }))
                  : [],

                variants: variants
                  .filter((variant) => variant.enabled)
                  .map((variant) => {
                    const variantId = variant.id;
                    const variantPrice = variant?.priceWithTax;
                    const variantSku = variant?.sku;

                    if (
                      variantPrice === undefined ||
                      variantSku === undefined
                    ) {
                      undefindedVariants.push({
                        variantId,
                        productName: product.name,
                      });
                    }

                    return {
                      id: variantId,
                      priceWithTax: variant.priceWithTax,
                      currencyCode: variant.currencyCode,
                      stockonHand: variant.stockOnHand,
                      outOfStockThreshold: variant.outOfStockThreshold,
                      sku: variant.sku,
                      name: variant.translations[0]?.name,
                      assets: variant.assets
                        ? variant.assets.map((asset) => ({
                            preview: asset.asset.preview,
                            source: asset.asset.source,
                          }))
                        : [],
                      featuredAsset: variant.featuredAsset
                        ? {
                            preview: variant.featuredAsset.preview,
                            source: variant.featuredAsset.source,
                          }
                        : {},
                      options: variant.options
                        ? variant.options.map((options) => ({
                            code: options.code,
                            name: options.translations.find(
                              (translation) =>
                                translation.languageCode == ctx.languageCode
                            )?.name,
                          }))
                        : [],
                    };
                  }),
              };
              if (
                nextProductsBatch.items.length === 0 &&
                productsBatch.items.length - 1 === index
              ) {
                catalogStream.push(
                  `\n\t"${selectedProductCatalog.id}": ` +
                    JSON.stringify(selectedProductCatalog, null, "\t\t")
                );
              } else {
                catalogStream.push(
                  `\n\t"${selectedProductCatalog.id}": ` +
                    JSON.stringify(selectedProductCatalog, null, "\t\t") +
                    ","
                );
              }
            });
            offset += batchSize;
          }

          const readableState = (catalogStream as any)._readableState;
          const totalItems = readableState.buffer.length;

          catalogStream.push(
            `\n},\n "totalItems":${totalItems},\n "failedVariants":${
              undefindedVariants.length === 0 ? "[]" : undefindedVariants
            }\n}`
          );

          catalogStream.push(null);

          const savedTo = await assetStorageStrategy.writeFileFromStream(
            this.filePath,
            catalogStream
          );

          return `${totalItems} products saved to ${savedTo}`;
        } catch (error) {
          console.error(error);
        }
      },
    });
  }

  async saveCatalogToFile() {
    const job = await this.saveCatalogJobQueue.add( { retries: 2 });
    return job.updates().pipe(
      map(update => {
          return update.result;
      }),
      catchError(err => of(err.message)),
  );  }

  async getAllProductRel(ctx: RequestContext) {
    return await this.productService.findAll(ctx, { skip: 0, take: 100 }, [
      "variants",
      "variants.options",
      "optionGroups",
      "assets",
      "featuredAsset",
      "facetValues",
      "facetValues.facet",
      "variants.featuredAsset",
      "variants.assets",
    ]);
  }

  async readCatalogFromFile() {
    try {
      const stream =
        await this.configService.assetOptions.assetStorageStrategy.readFileToStream(
          this.filePath
        );

      if (stream) {
        const jsonData = await streamToJson(stream);
        return jsonData;
      } 
    } catch (error:any) {
      if (error.errno === -2 ){
        const errorMessage = error.message.replace('ENOENT: ', '') + '<br><br>' + 'before proceeding, try saving the catalog with <b>/productcatalog-save</b>.'
        return errorMessage;       
      }else{
         return error.message
      } 
    }
  }
}
