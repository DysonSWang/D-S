/**
 * 奖励商店种子数据
 * 初始化商店商品
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shopItems = [
  // 装饰类商品
  {
    name: '温馨台灯',
    description: '柔和的灯光，让小屋更温馨',
    category: 'DECORATION',
    priceType: 'BONES',
    price: 200,
    stock: -1,
    limitPerUser: 10,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 1 }), // 假设 decorationId=1 是台灯
    isActive: true,
    sort: 1,
  },
  {
    name: '绿植盆栽',
    description: '生机勃勃的绿植，为小屋增添活力',
    category: 'DECORATION',
    priceType: 'BONES',
    price: 150,
    stock: -1,
    limitPerUser: 10,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 2 }),
    isActive: true,
    sort: 2,
  },
  {
    name: '舒适地毯',
    description: '柔软的地毯，踩上去很舒服',
    category: 'DECORATION',
    priceType: 'BONES',
    price: 300,
    stock: -1,
    limitPerUser: 5,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 3 }),
    isActive: true,
    sort: 3,
  },
  {
    name: '艺术挂画',
    description: '提升品味的艺术挂画',
    category: 'DECORATION',
    priceType: 'FISH',
    price: 100,
    stock: -1,
    limitPerUser: 5,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 4 }),
    isActive: true,
    sort: 4,
  },
  {
    name: '豪华沙发',
    description: '宽敞舒适的沙发，招待朋友必备',
    category: 'DECORATION',
    priceType: 'GEMS',
    price: 50,
    stock: -1,
    limitPerUser: 3,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 5 }),
    isActive: true,
    sort: 5,
  },
  {
    name: '星空投影灯',
    description: '把星空搬进小屋，浪漫满分',
    category: 'DECORATION',
    priceType: 'GEMS',
    price: 80,
    stock: -1,
    limitPerUser: 3,
    itemType: 'DECORATION',
    itemConfig: JSON.stringify({ decorationId: 6 }),
    isActive: true,
    sort: 6,
  },
  // 特效类商品
  {
    name: '庆祝烟花',
    description: '在小屋上空绽放的虚拟烟花',
    category: 'EFFECT',
    priceType: 'HEARTS',
    price: 50,
    stock: -1,
    limitPerUser: 20,
    itemType: 'EFFECT',
    itemConfig: JSON.stringify({ effectType: 'FIREWORKS' }),
    isActive: true,
    sort: 10,
  },
  {
    name: '背景音乐 - 轻音乐',
    description: '舒缓的轻音乐，放松心情',
    category: 'EFFECT',
    priceType: 'HEARTS',
    price: 30,
    stock: -1,
    limitPerUser: 10,
    itemType: 'EFFECT',
    itemConfig: JSON.stringify({ effectType: 'BGM_RELAX' }),
    isActive: true,
    sort: 11,
  },
  // 特权类商品
  {
    name: '任务刷新卡',
    description: '可以刷新一次每日任务',
    category: 'PRIVILEGE',
    priceType: 'BONES',
    price: 100,
    stock: -1,
    limitPerUser: 5,
    itemType: 'COUPON',
    itemConfig: JSON.stringify({ couponType: 'TASK_REFRESH' }),
    isActive: true,
    sort: 20,
  },
  {
    name: '双倍奖励卡',
    description: '下次任务完成获得双倍奖励',
    category: 'PRIVILEGE',
    priceType: 'FISH',
    price: 80,
    stock: -1,
    limitPerUser: 3,
    itemType: 'COUPON',
    itemConfig: JSON.stringify({ couponType: 'DOUBLE_REWARD' }),
    isActive: true,
    sort: 21,
  },
  // 实物类商品（示例）
  {
    name: '星契定制徽章',
    description: '精美的星契主题徽章，包邮到家',
    category: 'PHYSICAL',
    priceType: 'STARS',
    price: 200,
    stock: 100,
    limitPerUser: 2,
    itemType: 'PHYSICAL',
    itemConfig: JSON.stringify({ shippingRequired: true }),
    isActive: true,
    sort: 30,
    startDate: new Date(),
    endDate: new Date('2026-12-31'),
  },
];

async function seedShop() {
  console.log('🏪 开始初始化奖励商店数据...');

  let created = 0;
  let skipped = 0;

  for (const itemData of shopItems) {
    try {
      const existing = await prisma.shopItem.findFirst({
        where: { name: itemData.name },
      });

      if (existing) {
        console.log(`  ⏭️  跳过：${itemData.name} (已存在)`);
        skipped++;
        continue;
      }

      await prisma.shopItem.create({
        data: itemData as any,
      });
      console.log(`  ✅ 创建：${itemData.name}`);
      created++;
    } catch (error) {
      console.error(`  ❌ 失败：${itemData.name}`, error);
    }
  }

  console.log(`\n🎉 奖励商店初始化完成！`);
  console.log(`   新增：${created} 个商品`);
  console.log(`   跳过：${skipped} 个商品`);

  await prisma.$disconnect();
}

seedShop().catch(console.error);
