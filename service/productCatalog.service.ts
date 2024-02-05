import * as fs from "fs";
import * as path from "path";
import { Injectable } from "@nestjs/common";
import {
  ProductService,
  RequestContext,
  ProductVariantService,
  Translated,
  ProductVariant,
  Product,
  ProductOptionService,
  ProductOptionGroupService,
  ID,
} from "@vendure/core";

function capitalizeFirstLetter(input: string): string {
  return input
    .split(/[\s\-_&+]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

@Injectable()
export class ProductCatalogService {
  constructor(
    private ProductService: ProductService,
    private ProductVariantService: ProductVariantService,

  ) {}
  private static readonly catalogDirectory = "./static/productcatalog";
  private static readonly catalogFilePath = path.join(
    ProductCatalogService.catalogDirectory,
    "productcatalog.json"
  );

  async getAllProductRel(ctx:RequestContext){
      return await this.ProductService.findAll(
          ctx,
          { skip:0, take:100 },
          ['variants', 'variants.options','optionGroups', 'assets', 'featuredAsset','facetValues','facetValues.facet', 'variants.featuredAsset', 'variants.assets']
          );
  }

  async getProductCatalogData(ctx: RequestContext) {
    try {
      const batchSize = 100;
      let offset = 0;
      let allVariants: Translated<ProductVariant>[] = [];
      let allProducts: Translated<Product>[] = [];

      while (true) {
        const batch = await this.ProductService.findAll(
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

        if (batch.items.length === 0) {
          break;
        }

        allProducts = allProducts.concat(batch.items);

        if (batch.items.length < batchSize) {
          break;
        }

        offset += batchSize;
      }

      offset = 0;
      while (true) {
        const batch = await this.ProductVariantService.findAll(ctx, {
          skip: offset,
          take: batchSize,
        });

        if (batch.items.length === 0) {
          break;
        }

        allVariants = allVariants.concat(batch.items);

        if (batch.items.length < batchSize) {
          break;
        }

        offset += batchSize;
      }

      const productVariantMap: { [id: number]: any } = {};
      allVariants.forEach((variants) => {
        productVariantMap[variants.id] = variants;
      });
      const selectedProductCatalog = {};
      const failedVariants: { variantId: ID; productName: string, productId:ID, SKU:any }[] = [];

      for (const productId in allProducts) {
        if (allProducts.hasOwnProperty(productId)) {
          const product = allProducts[productId];
          if (!product.enabled) {
            continue;
          }
          selectedProductCatalog[productId] = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            updatedAt: product.updatedAt,
            customFields: product.customFields,
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
          };

          selectedProductCatalog[productId].variants = product.variants
    .filter((variant) => variant.enabled)
    .map((variant) => {
        const variantId = variant.id;
        const variantPrice = productVariantMap[variantId]?.priceWithTax;

        if (variantPrice === undefined) {
            failedVariants.push({
                variantId,
                productName: product.name,
                productId:product.id,
                SKU: variant.sku,
            });
        }

    

        return {
            id: variantId,
            priceWithTax: variantPrice,
            dicount: variant.customFields.discount,
            currencyCode: productVariantMap[variantId]?.currencyCode,
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
          });
        }
      }
      const totalItems = Object.keys(selectedProductCatalog).length
      return {productCatalog:selectedProductCatalog,totalItems,failedVariants};

    } catch (error) {
      throw error;
    }
  }

  saveCatalogToFile(catalogData: any): void {
    try {
      if (!fs.existsSync(ProductCatalogService.catalogDirectory)) {
        fs.mkdirSync(ProductCatalogService.catalogDirectory, {
          recursive: true,
        });
      }
      if (!fs.existsSync(ProductCatalogService.catalogFilePath)) {
        fs.writeFileSync(ProductCatalogService.catalogFilePath, "", "utf-8");
      }

      const catalogJson = JSON.stringify(catalogData, null, 2);
      fs.writeFileSync(
        ProductCatalogService.catalogFilePath,
        catalogJson,
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving catalog data to file:", error);
    }
  }

  readCatalogFromFile(): any {
    try {
      const catalogJson = fs.readFileSync(
        ProductCatalogService.catalogFilePath,
        "utf-8"
      );
      return JSON.parse(catalogJson);
    } catch (error) {
      console.error("Error reading catalog data from file:", error);
      return null;
    }
  }
}
