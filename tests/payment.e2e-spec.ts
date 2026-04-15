import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

function sortObject(obj: any) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });
  return sorted;
}

function generateVnpayParams(
  orderId: string,
  amount: number,
  responseCode: string,
  isFakeSignature = false,
) {
  let params = {
    vnp_Amount: amount * 100,
    vnp_Command: 'pay',
    vnp_CreateDate: '20231010120000',
    vnp_CurrCode: 'VND',
    vnp_IpAddr: '127.0.0.1',
    vnp_Locale: 'vn',
    vnp_OrderInfo: 'Thanh toan test',
    vnp_OrderType: 'other',
    vnp_ResponseCode: responseCode,
    vnp_TmnCode: process.env.VNP_TMNCODE || 'TEST_TMN',
    vnp_TxnRef: orderId,
    vnp_TransactionNo: '123456789',
  };

  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const secret = process.env.VNP_HASHSECRET || 'TEST_SECRET';

  let signed = crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
  if (isFakeSignature) signed = 'fake_signature_123';

  return { ...params, vnp_SecureHash: signed };
}

function generateMomoIpnBody(
  orderId: string,
  amount: number,
  resultCode: number,
  isFakeSignature = false,
) {
  const partnerCode = process.env.MOMO_PARTNER_CODE || 'TEST_MOMO';
  const accessKey = process.env.MOMO_ACCESS_KEY || 'TEST_ACCESS';
  const secretKey = process.env.MOMO_SECRET_KEY || 'TEST_SECRET';

  const body = {
    partnerCode,
    orderId,
    requestId: orderId,
    amount,
    orderInfo: 'Thanh toan test MoMo',
    orderType: 'momo_wallet',
    transId: 987654321,
    resultCode,
    message: resultCode === 0 ? 'Success' : 'Failed',
    payType: 'qr',
    responseTime: Date.now(),
    extraData: '',
    signature: '',
  };

  const rawSignature = `accessKey=${accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;

  let signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
  if (isFakeSignature) signature = 'fake_momo_signature';

  body.signature = signature;
  return body;
}

describe('Payment API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUserId: string;
  let orderVnpayId: string;
  let orderMomoId: string;
  const orderAmount = 50000;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    const user = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@test.com`,
        name: 'Tester',
        password: 'hash',
      },
    });
    testUserId = user.id;

    const order1 = await prisma.order.create({
      data: {
        userId: testUserId,
        subtotalPrice: orderAmount,
        totalPrice: orderAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });
    orderVnpayId = order1.id;

    const order2 = await prisma.order.create({
      data: {
        userId: testUserId,
        subtotalPrice: orderAmount,
        totalPrice: orderAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });
    orderMomoId = order2.id;
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu rác sau khi test xong
    await prisma.payment.deleteMany({ where: { userId: testUserId } });
    await prisma.order.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
    await app.close();
  });

  it('TC_PAY_01: [POST /payment/create] Tạo URL VNPay thành công', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment/create')
      .send({ orderId: orderVnpayId });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toContain('vnp_Command=pay');
  });

  it('TC_PAY_02: [POST /payment/create] Tạo URL VNPay thất bại do ID ảo', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment/create')
      .send({ orderId: 'id-khong-ton-tai' });

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('TC_PAY_03: [GET /payment/vnpay_return] Chuyển hướng Success khi user thanh toán xong', async () => {
    const validQuery = generateVnpayParams(orderVnpayId, orderAmount, '00');

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_return')
      .query(validQuery);

    expect(res.status).toBe(HttpStatus.FOUND); // 302 Redirect
    expect(res.header.location).toContain('/checkout/success');
  });

  it('TC_PAY_04: [GET /payment/vnpay_return] Chuyển hướng Error khi user hủy (24)', async () => {
    const cancelQuery = generateVnpayParams(orderVnpayId, orderAmount, '24');

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_return')
      .query(cancelQuery);

    expect(res.status).toBe(HttpStatus.FOUND);
    expect(res.header.location).toContain('error?code=24');
  });

  it('TC_PAY_05: [GET /payment/vnpay_return] Sai chữ ký báo lỗi 97', async () => {
    const fakeQuery = generateVnpayParams(
      orderVnpayId,
      orderAmount,
      '00',
      true,
    ); // isFake = true

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_return')
      .query(fakeQuery);

    expect(res.status).toBe(HttpStatus.FOUND);
    expect(res.header.location).toContain('error?code=97');
  });

  it('TC_PAY_07: [GET /payment/vnpay_ipn] IPN từ chối cập nhật do sai Checksum', async () => {
    const fakeIpn = generateVnpayParams(orderVnpayId, orderAmount, '00', true);

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_ipn')
      .query(fakeIpn);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.RspCode).toBe('97');
  });

  it('TC_PAY_08: [GET /payment/vnpay_ipn] IPN từ chối do lệch số tiền (Amount)', async () => {
    const wrongAmountIpn = generateVnpayParams(orderVnpayId, 999999, '00'); // Gửi 999k thay vì 50k

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_ipn')
      .query(wrongAmountIpn);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.RspCode).toBe('04');
  });

  it('TC_PAY_06: [GET /payment/vnpay_ipn] IPN cập nhật thành công (Happy Case)', async () => {
    const validIpn = generateVnpayParams(orderVnpayId, orderAmount, '00');

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_ipn')
      .query(validIpn);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.RspCode).toBe('00');

    // Xác minh Database Order đã lên trạng thái PAID
    const orderInDb = await prisma.order.findUnique({
      where: { id: orderVnpayId },
    });
    expect(orderInDb.status).toBe('PAID');
    expect(orderInDb.paymentStatus).toBe('SUCCEEDED');
  });

  it('TC_PAY_09: [GET /payment/vnpay_ipn] IPN từ chối do Order đã được thanh toán', async () => {
    const duplicateIpn = generateVnpayParams(orderVnpayId, orderAmount, '00');

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_ipn')
      .query(duplicateIpn);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.RspCode).toBe('02'); // already confirmed
  });

  it('TC_PAY_10: [GET /payment/vnpay_ipn] Hủy giao dịch (Code 24) -> Đơn về CANCELED', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@test.com`,
        name: 'Tester',
        password: 'hash',
      },
    });
    testUserId = user.id;

    const cancelOrder = await prisma.order.create({
      data: {
        userId: testUserId,
        subtotalPrice: orderAmount,
        totalPrice: orderAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    const cancelIpn = generateVnpayParams(cancelOrder.id, 10000, '24'); // Gửi mã hủy

    const res = await request(app.getHttpServer())
      .get('/payment/vnpay_ipn')
      .query(cancelIpn);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.RspCode).toBe('00'); // Server vẫn trả 00 cho VNPay hiểu là đã nhận tín hiệu

    // Xác minh Database
    const checkDb = await prisma.order.findUnique({
      where: { id: cancelOrder.id },
    });
    expect(checkDb.status).toBe('CANCELED');
    expect(checkDb.paymentStatus).toBe('FAILED');
  });

  //MOMO

  it('TC_MOMO_01: [POST /payment/momo/create] Tạo URL MoMo thành công', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment/momo/create')
      .send({ orderId: orderMomoId });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toHaveProperty('url');
  });

  it('TC_MOMO_02: [GET /payment/momo_return] Chuyển hướng Success', async () => {
    const res = await request(app.getHttpServer())
      .get('/payment/momo_return')
      .query({ resultCode: 0 }); // resultCode=0 là thành công

    expect(res.status).toBe(HttpStatus.FOUND);
    expect(res.header.location).toContain('/checkout/success');
  });

  it('TC_MOMO_04: [POST /payment/momo_ipn] Sai chữ ký bảo mật báo lỗi', async () => {
    const fakeIpnBody = generateMomoIpnBody(orderMomoId, orderAmount, 0, true); // isFake = true

    const res = await request(app.getHttpServer())
      .post('/payment/momo_ipn')
      .send(fakeIpnBody);

    // API của bạn hiện đang chặn lỗi và trả về 201 cho MoMo dù sai chữ ký
    expect(res.status).toBe(HttpStatus.CREATED);

    // Order phải CHƯA được thanh toán
    const checkDb = await prisma.order.findUnique({
      where: { id: orderMomoId },
    });
    expect(checkDb.status).toBe('PENDING');
  });

  it('TC_MOMO_03: [POST /payment/momo_ipn] Cập nhật DB thành công', async () => {
    const validIpnBody = generateMomoIpnBody(orderMomoId, orderAmount, 0);

    const res = await request(app.getHttpServer())
      .post('/payment/momo_ipn')
      .send(validIpnBody);

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.message).toBe('Received IPN successfully');

    // Xác minh Database
    const checkDb = await prisma.order.findUnique({
      where: { id: orderMomoId },
    });
    expect(checkDb.status).toBe('PAID');
    expect(checkDb.paymentMethod).toBe('MOMO');
  });
});
