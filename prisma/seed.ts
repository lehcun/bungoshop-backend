import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Category
  const categories = await prisma.category.createMany({
    data: [
      { id: 1, name: 'Áo' },
      { id: 2, name: 'Quần' },
      { id: 3, name: 'Giày' },
      { id: 4, name: 'Balo' },
      { id: 5, name: 'Phụ kiện' },
      { id: 6, name: 'Đồ điện tử' },
    ],
    skipDuplicates: true,
  });

  // 2. Seed Brand
  const brands = await prisma.brand.createMany({
    data: [
      { id: 1, name: 'Nike' },
      { id: 2, name: 'Uniqlo' },
      { id: 3, name: 'Adidas' },
      { id: 4, name: 'Samsonite' },
      { id: 5, name: 'Casio' },
      { id: 6, name: 'Sony' },
    ],
    skipDuplicates: true,
  });

  // 3. Seed Product
  await prisma.product.createMany({
    data: [
      {
        id: 'p1',
        name: 'Áo thun nam basic',
        description: 'Áo thun cotton thoáng mát',
        price: 150000,
        discount: 10,
        status: 'HOT',
        categoryId: 1,
        brandId: 1,
      },
      {
        id: 'p2',
        name: 'Áo sơ mi trắng',
        description: 'Sơ mi form slim fit, công sở',
        price: 250000,
        discount: 15,
        status: 'BEST',
        categoryId: 1,
        brandId: 2,
      },
      {
        id: 'p3',
        name: 'Quần jeans xanh',
        description: 'Jeans ống đứng, phong cách trẻ',
        price: 350000,
        discount: 20,
        status: 'NEW',
        categoryId: 2,
        brandId: 1,
      },
      {
        id: 'p4',
        name: 'Giày sneaker trắng',
        description: 'Sneaker unisex, dễ phối đồ',
        price: 600000,
        discount: 5,
        status: 'HOT',
        categoryId: 3,
        brandId: 3,
      },
      {
        id: 'p5',
        name: 'Áo khoác gió',
        description: 'Chống nắng, chống mưa nhẹ',
        price: 450000,
        discount: 25,
        status: 'BEST',
        categoryId: 1,
        brandId: 2,
      },
      {
        id: 'p6',
        name: 'Balo laptop 15 inch',
        description: 'Chống sốc, chống nước',
        price: 500000,
        discount: 10,
        status: 'NEW',
        categoryId: 4,
        brandId: 4,
      },
      {
        id: 'p7',
        name: 'Đồng hồ dây da',
        description: 'Thiết kế sang trọng, lịch lãm',
        price: 1200000,
        discount: 0,
        status: 'BEST',
        categoryId: 5,
        brandId: 5,
      },
      {
        id: 'p8',
        name: 'Áo hoodie unisex',
        description: 'Phong cách đường phố, oversize',
        price: 320000,
        discount: 10,
        status: 'HOT',
        categoryId: 1,
        brandId: 3,
      },
      {
        id: 'p9',
        name: 'Tai nghe Bluetooth',
        description: 'Pin 20h, chống ồn chủ động',
        price: 800000,
        discount: 15,
        status: 'NEW',
        categoryId: 6,
        brandId: 6,
      },
      {
        id: 'p10',
        name: 'Áo polo nam',
        description: 'Áo polo vải cá sấu, thoáng mát',
        price: 200000,
        discount: 5,
        status: 'HOT',
        categoryId: 1,
        brandId: 1,
      },
    ],
    skipDuplicates: true,
  });

  // 4. Seed ProductImage
  await prisma.productImage.createMany({
    data: [
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/ThunNamBasic_fzeaux.jpg',
        productId: 'p1',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/SoMiNam_gd0yzr.jpg',
        productId: 'p2',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/QuanJean_a2kbed.jpg',
        productId: 'p3',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469769/BasicSneaker_yupbms.jpg',
        productId: 'p4',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469767/AoKhoacGio_uti19o.jpg',
        productId: 'p5',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469767/Balo15Inch_e9ehtx.jpg',
        productId: 'p6',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/DongHoDayDa_jyoqlq.jpg',
        productId: 'p7',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469766/AoHoodieUnisex_nvpnid.jpg',
        productId: 'p8',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/TaiNgheBluetooth_y5rl0i.jpg',
        productId: 'p9',
      },
      {
        url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/AoPoloNam_tiykxa.png',
        productId: 'p10',
      },
    ],
    skipDuplicates: true,
  });

  // 5. Seed ProductVariant
  await prisma.productVariant.createMany({
    data: [
      { productId: 'p1', size: 'M', color: 'Trắng', stock: 20 },
      { productId: 'p1', size: 'L', color: 'Đen', stock: 15 },
      { productId: 'p2', size: 'M', color: 'Trắng', stock: 30 },
      { productId: 'p3', size: '32', color: 'Xanh', stock: 10 },
      { productId: 'p4', size: '42', color: 'Trắng', stock: 25 },
    ],
    skipDuplicates: true,
  });

  console.log('🌱 Seed dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
