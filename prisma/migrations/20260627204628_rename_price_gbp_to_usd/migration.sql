-- Rename priceGbp to priceUsd on ProductVariant
ALTER TABLE "ProductVariant" RENAME COLUMN "priceGbp" TO "priceUsd";
