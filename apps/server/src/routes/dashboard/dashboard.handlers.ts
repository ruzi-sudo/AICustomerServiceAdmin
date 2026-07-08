import { OpenAPIHono } from '@hono/zod-openapi';
import { faker } from '@faker-js/faker/locale/zh_CN';
import { verifyToken } from '../../middlewares/auth';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './dashboard.routes';
import * as dashboardService from '../../service/dashboard.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

// Helper to extract user from auth header
function getUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return verifyToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

const cardList = Array.from({ length: 48 }, (_, i) => ({
  index: i + 1,
  isSetup: [true, false][i % 2],
  type: (i % 5) + 1,
  banner: [
    'https://tdesign.gtimg.com/tdesign-pro/cloud-server.jpg',
    'https://tdesign.gtimg.com/tdesign-pro/t-sec.jpg',
    'https://tdesign.gtimg.com/tdesign-pro/ssl.jpg',
    'https://tdesign.gtimg.com/tdesign-pro/face-recognition.jpg',
    'https://tdesign.gtimg.com/tdesign-pro/cloud-db.jpg',
  ][i % 5],
  name: ['SSL证书', '人脸识别', 'CVM', '云数据库', 'T-Sec 云防火墙'][i % 5],
  description: 'SSL证书又叫服务器证书，腾讯云为您提供证书的一站式服务',
}));

function generateMapList() {
  return Array.from({ length: 200 }, () => ({
    plateNumber: `豫A${String(Math.floor(Math.random() * 90000) + 10000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    driver: faker.person.firstName(),
    orientation: Math.floor(Math.random() * 360) + 1,
    lng: 113 + Math.random() * 1.1,
    lat: 34 + Math.random() * 1.1,
  }));
}

route.openapi(routes.getCardList, async (c) => {
  return c.json({ code: 0, message: '操作成功', data: { list: cardList } });
});

route.openapi(routes.getMapInfo, async (c) => {
  return c.json({ code: 0, message: '操作成功', data: generateMapList() });
});

route.openapi(routes.getMine, async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json({ code: 10002, message: '未登录', data: {} }, 401);
  }
  const data = await dashboardService.getMineInfo(user.username);
  return c.json({ code: 0, message: '操作成功', data: data || {} });
});

route.openapi(routes.getMineLogs, async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json({ code: 10002, message: '未登录', data: {} }, 401);
  }
  const data = await dashboardService.getMineLogs(user.userId);
  return c.json({ code: 0, message: '操作成功', data });
});
