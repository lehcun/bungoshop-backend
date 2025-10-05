import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Xoá dữ liệu cũ (chạy seed nhiều lần không bị lỗi)
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  console.log('🗑️ Xoá dữ liệu cũ xong');

  // Seed Brand
  await prisma.brand.createMany({
    data: [
      {
        name: 'Nike',
        logoUrl:
          'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759546527/nike-Photoroom_lstm9l.png',
      },
      {
        name: 'Adidas',
        logoUrl:
          'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759546531/adidas-Photoroom_r49ulk.png',
      },
      {
        name: 'Puma',
        logoUrl:
          'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556762/puma-logo_xav28a.pnghttps://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556762/puma-logo_xav28a.png',
      },
      {
        name: 'Gucci',
        logoUrl:
          'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556756/gucci-logo-Photoroom_ib7wya.png',
      },
      {
        name: 'Uniqlo',
        logoUrl:
          'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556795/UNIQLO_logo_bc3swc.png',
      },
    ],
    skipDuplicates: true,
  });
  // Seed Category
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Shoes' },
      { name: 'Clothes' },
      { name: 'Accessories' },
      { name: 'Bags' },
      { name: 'Electronics' },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Seeded ${categories.count} categories`);

  // Lấy id brand + category để gắn vào Product
  const nike = await prisma.brand.findFirst({ where: { name: 'Nike' } });
  const adidas = await prisma.brand.findFirst({ where: { name: 'Adidas' } });
  const puma = await prisma.brand.findFirst({ where: { name: 'Puma' } });
  const gucci = await prisma.brand.findFirst({ where: { name: 'Gucci' } });
  const uniqlo = await prisma.brand.findFirst({ where: { name: 'Uniqlo' } });

  const shoes = await prisma.category.findFirst({ where: { name: 'Shoes' } });
  const clothes = await prisma.category.findFirst({
    where: { name: 'Clothes' },
  });
  const accessories = await prisma.category.findFirst({
    where: { name: 'Accessories' },
  });
  const bags = await prisma.category.findFirst({
    where: { name: 'Bags' },
  });
  const electronics = await prisma.category.findFirst({
    where: { name: 'Electronics' },
  });

  // Seed Product (dùng create để gắn quan hệ)
  await prisma.product.create({
    data: {
      name: 'Nike Air Max 270',
      description: 'Giày thể thao Nike phong cách trẻ trung',
      price: 330000,
      discount: 10,
      status: 'HOT',
      brandId: nike!.id,
      categoryId: shoes!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556947/Airmax2_j2saiy.webp',
          },
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759556948/Airmax_t8z1xt.avif',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Black', stock: 20 },
          { size: 'L', color: 'White', stock: 15 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Adidas Stan Smith',
      description: 'Mẫu giày Adidas cổ điển',
      price: 110000,
      discount: 5,
      status: 'BEST',
      brandId: adidas!.id,
      categoryId: shoes!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557051/Stan_Smith_mdayaa.avif',
          },
        ],
      },
      variants: {
        create: [
          { size: '40', color: 'White/Green', stock: 12 },
          { size: '41', color: 'White/Blue', stock: 8 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Gucci Polo Shirt',
      description: 'Áo polo Gucci hàng hiệu',
      price: 350000,
      discount: 15,
      status: 'NEW',
      brandId: gucci!.id,
      categoryId: clothes!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557110/PoloGucci_xdtu1s.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Black', stock: 10 },
          { size: 'L', color: 'White', stock: 6 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Uniqlo T-Shirt Basic',
      description: 'Áo thun basic Uniqlo thoáng mát',
      price: 200000,
      discount: 0,
      status: 'HOT',
      brandId: uniqlo!.id,
      categoryId: clothes!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557232/Uniqlo_T-Shirt_Basic_vdfb43.avif',
          },
        ],
      },
      variants: {
        create: [
          { size: 'S', color: 'Gray', stock: 30 },
          { size: 'M', color: 'Black', stock: 25 },
          { size: 'L', color: 'White', stock: 20 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Puma Running Shoes',
      description: 'Giày chạy bộ Puma bền và nhẹ',
      price: 490000,
      discount: 10,
      status: 'HOT',
      brandId: puma!.id,
      categoryId: shoes!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557407/Puma_Running_Shoes_zx1ron.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: '39', color: 'Red', stock: 15 },
          { size: '40', color: 'Blue', stock: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Ray-Ban Classic Aviator',
      description:
        'Kính mát Ray-Ban phong cách cổ điển, bảo vệ mắt chống tia UV400',
      price: 120000,
      discount: 15,
      status: 'NEW',
      categoryId: accessories!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557439/ray-ban-aviator_ctpaio.webp',
          },
        ],
      },
      variants: {
        create: [
          { size: 'One Size', color: 'Gold', stock: 25 },
          { size: 'One Size', color: 'Silver', stock: 18 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Casio MTP-V002D',
      description: 'Đồng hồ Casio dây kim loại sang trọng, chống nước nhẹ',
      price: 900000,
      discount: 5,
      status: 'HOT',
      categoryId: accessories!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557554/Casio_MTP_tlgzqe.png',
          },
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557556/Casio_MTP_2_wanykg.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Silver', stock: 30 },
          { size: 'M', color: 'Black', stock: 20 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'MLB Classic Cap',
      description:
        'Mũ lưỡi trai MLB phong cách đường phố, chất liệu cotton thoáng mát',
      price: 155000,
      discount: 10,
      categoryId: accessories!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557609/MLB_Classic_Cap_iaq5ce.webp',
          },
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557611/MLB_Classic_Cap_2_vpyvbe.webp',
          },
        ],
      },
      variants: {
        create: [
          { size: 'Free Size', color: 'Black', stock: 40 },
          { size: 'Free Size', color: 'White', stock: 35 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Nike Heritage Backpack',
      description: 'Balo Nike Heritage thời trang, phù hợp đi học và du lịch',
      price: 7500000,
      discount: 50,
      status: 'HOT',
      brandId: nike!.id,
      categoryId: bags!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557714/Nike_Heritage_Backpack_jetrwf.jpg',
          },
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557715/Nike_Heritage_Backpack_2_qvedvl.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Black', stock: 25 },
          { size: 'M', color: 'Blue', stock: 18 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Leather Office Bag',
      description:
        'Cặp da công sở thời trang, nhiều ngăn tiện dụng cho laptop và tài liệu',
      price: 160000,
      discount: 10,
      status: 'HOT',
      categoryId: bags!.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557771/Leather_Office_Bag_dh3zcm.jpg',
          },
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759557773/Leather_Office_Bag_2_viaglk.webp',
          },
        ],
      },
      variants: {
        create: [
          { size: 'One Size', color: 'Brown', stock: 20 },
          { size: 'One Size', color: 'Black', stock: 15 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Áo thun nam basic',
      description: 'Áo thun cotton thoáng mát, dễ phối đồ.',
      price: 150000,
      discount: 10,
      status: 'HOT',
      brandId: nike.id,
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/ThunNamBasic_fzeaux.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Trắng', stock: 20 },
          { size: 'L', color: 'Đen', stock: 15 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Áo sơ mi trắng',
      description: 'Sơ mi form slim fit, công sở thanh lịch.',
      price: 250000,
      discount: 15,
      status: 'BEST',
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/SoMiNam_gd0yzr.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Trắng', stock: 25 },
          { size: 'L', color: 'Xanh nhạt', stock: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Quần jeans xanh',
      description: 'Jeans ống đứng, phong cách trẻ trung.',
      price: 350000,
      discount: 20,
      status: 'NEW',
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/QuanJean_a2kbed.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: '30', color: 'Xanh đậm', stock: 18 },
          { size: '32', color: 'Xanh nhạt', stock: 12 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Giày sneaker trắng',
      description: 'Sneaker unisex, dễ phối đồ, nhẹ và thoải mái.',
      price: 600000,
      discount: 5,
      status: 'HOT',
      categoryId: shoes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469769/BasicSneaker_yupbms.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: '40', color: 'Trắng', stock: 15 },
          { size: '42', color: 'Đen', stock: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Áo khoác gió',
      description: 'Chống nắng, chống mưa nhẹ, dễ gấp gọn.',
      price: 450000,
      discount: 25,
      status: 'BEST',
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469767/AoKhoacGio_uti19o.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Xanh navy', stock: 20 },
          { size: 'L', color: 'Đen', stock: 12 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Balo laptop 15 inch',
      description: 'Chống sốc, chống nước, nhiều ngăn tiện lợi.',
      price: 500000,
      discount: 10,
      status: 'NEW',
      categoryId: bags.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469767/Balo15Inch_e9ehtx.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: '15 inch', color: 'Xám', stock: 10 },
          { size: '15 inch', color: 'Đen', stock: 8 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Đồng hồ dây da',
      description: 'Thiết kế sang trọng, lịch lãm cho nam giới.',
      price: 1200000,
      discount: 0,
      status: 'BEST',
      categoryId: accessories.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/DongHoDayDa_jyoqlq.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Nâu', stock: 6 },
          { size: 'M', color: 'Đen', stock: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Áo hoodie unisex',
      description: 'Phong cách đường phố, form oversize.',
      price: 320000,
      discount: 10,
      status: 'HOT',
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469766/AoHoodieUnisex_nvpnid.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Be', stock: 15 },
          { size: 'L', color: 'Đen', stock: 20 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Tai nghe Bluetooth',
      description: 'Pin 20h, chống ồn chủ động, kết nối nhanh.',
      price: 800000,
      discount: 15,
      status: 'NEW',
      categoryId: electronics.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/TaiNgheBluetooth_y5rl0i.jpg',
          },
        ],
      },
      variants: {
        create: [
          { size: 'One Size', color: 'Đen', stock: 30 },
          { size: 'One Size', color: 'Trắng', stock: 25 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Áo polo nam',
      description: 'Vải cá sấu, thoáng mát, cổ bẻ lịch sự.',
      price: 200000,
      discount: 5,
      status: 'HOT',
      brandId: nike.id,
      categoryId: clothes.id,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/dbvlsf9bi/image/upload/v1759469768/AoPoloNam_tiykxa.png',
          },
        ],
      },
      variants: {
        create: [
          { size: 'M', color: 'Trắng', stock: 18 },
          { size: 'L', color: 'Xanh navy', stock: 12 },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
