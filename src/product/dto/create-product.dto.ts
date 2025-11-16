import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

// ==============================
// PRODUCT IMAGE DTO
// ==============================
export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  altText?: string;
}

// ==============================
// PRODUCT VARIANT DTO
// ==============================
export class CreateProductVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsObject()
  @IsOptional()
  metadata?: any; // JSON

  @IsInt()
  @IsOptional()
  price?: number; // giá riêng của variant

  @IsInt()
  @IsOptional()
  stock?: number = 0;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

// ==============================
// MAIN PRODUCT DTO
// ==============================
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  price: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  // ---------- Images ----------
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];

  // ---------- Variants ----------
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];
}
