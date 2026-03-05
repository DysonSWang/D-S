import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库...');

  // 1. 创建管理员账号
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      email: 'admin@example.com',
      role: 'ADMIN',
      nickname: '系统管理员',
      ageVerified: true,
    },
  });
  console.log('✅ 管理员账号创建成功 (admin/admin123)');

  // 2. 创建引导者账号
  const guidePassword = await bcrypt.hash('guide123', 10);
  const guide = await prisma.user.upsert({
    where: { username: 'guide' },
    update: {},
    create: {
      username: 'guide',
      passwordHash: guidePassword,
      email: 'guide@example.com',
      role: 'GUIDE',
      nickname: '引导者',
      ageVerified: true,
    },
  });
  console.log('✅ 引导者账号创建成功 (guide/guide123)');

  // 3. 创建成长者账号
  const growerPassword = await bcrypt.hash('grower123', 10);
  const grower = await prisma.user.upsert({
    where: { username: 'grower' },
    update: {},
    create: {
      username: 'grower',
      passwordHash: growerPassword,
      email: 'grower@example.com',
      role: 'GROWER',
      nickname: '成长者',
      ageVerified: true,
    },
  });
  console.log('✅ 成长者账号创建成功 (grower/grower123)');

  // 4. 创建伙伴关系
  const relationship = await prisma.relationship.create({
    data: {
      guideId: guide.id,
      growerId: grower.id,
      mode: 'PARTNER',
      status: 'ACTIVE',
      startDate: new Date(),
      agreementContent: '我们同意互相帮助，共同成长',
    },
  });
  console.log('✅ 伙伴关系创建成功');

  // 5. 创建成长者奖励账户
  await prisma.reward.create({
    data: {
      growerId: grower.id,
      bones: 100,
      fish: 10,
      gems: 5,
    },
  });
  console.log('✅ 奖励账户创建成功');

  // 6. 创建成长者小屋
  await prisma.cottage.create({
    data: {
      growerId: grower.id,
      level: 1,
      experience: 0,
      warmth: 0,
      maxSlots: 5,
    },
  });
  console.log('✅ 小屋创建成功');

  // 7. 创建装饰系列 (图鉴)
  const collections = [
    {
      name: '温馨家具系列',
      description: '打造舒适温馨的小屋',
      totalItems: 6,
      bonusReward: JSON.stringify({ bones: 100, fish: 10 }),
    },
    {
      name: '春日限定系列',
      description: '春天的气息，限定收藏',
      totalItems: 4,
      bonusReward: JSON.stringify({ fish: 20, gems: 5 }),
    },
    {
      name: '梦幻特效系列',
      description: '让小屋充满魔法',
      totalItems: 3,
      bonusReward: JSON.stringify({ gems: 10 }),
    },
  ];

  const createdCollections: any[] = [];
  for (const col of collections) {
    const created = await prisma.decorationCollection.create({
      data: col,
    });
    createdCollections.push(created);
  }
  console.log('✅ 装饰系列创建成功');

  // 8. 创建装饰物品（按系列分类）
  const decorationsWithCollection = [
    // 温馨家具系列
    { name: '木质桌子', category: 'FURNITURE', slotType: 'FURNITURE', rarity: 1, priceType: 'BONES', price: 50, warmthBonus: 5, collectionId: 1 },
    { name: '舒适沙发', category: 'FURNITURE', slotType: 'FURNITURE', rarity: 2, priceType: 'BONES', price: 80, warmthBonus: 12, collectionId: 1 },
    { name: '小台灯', category: 'FURNITURE', slotType: 'FURNITURE', rarity: 1, priceType: 'BONES', price: 25, warmthBonus: 3, collectionId: 1 },
    { name: '书架', category: 'FURNITURE', slotType: 'FURNITURE', rarity: 1, priceType: 'BONES', price: 60, warmthBonus: 6, collectionId: 1 },
    { name: '温馨地毯', category: 'FURNITURE', slotType: 'FLOOR', rarity: 2, priceType: 'FISH', price: 5, warmthBonus: 8, collectionId: 1 },
    { name: '艺术挂画', category: 'WALL', slotType: 'WALL', rarity: 1, priceType: 'BONES', price: 40, warmthBonus: 4, collectionId: 1 },
    
    // 春日限定系列
    { name: '绿色植物', category: 'PLANT', slotType: 'PLANT', rarity: 1, priceType: 'BONES', price: 30, warmthBonus: 3, collectionId: 2 },
    { name: '鲜花瓶', category: 'PLANT', slotType: 'PLANT', rarity: 1, priceType: 'BONES', price: 20, warmthBonus: 2, collectionId: 2 },
    { name: '樱花盆栽', category: 'PLANT', slotType: 'PLANT', rarity: 2, priceType: 'FISH', price: 8, warmthBonus: 10, collectionId: 2 },
    { name: '春天地毯', category: 'FURNITURE', slotType: 'FLOOR', rarity: 2, priceType: 'FISH', price: 6, warmthBonus: 8, collectionId: 2 },
    
    // 梦幻特效系列
    { name: '音乐盒', category: 'EFFECT', slotType: 'EFFECT', rarity: 2, priceType: 'FISH', price: 6, warmthBonus: 9, collectionId: 3 },
    { name: '水晶吊灯', category: 'FURNITURE', slotType: 'FURNITURE', rarity: 3, priceType: 'GEMS', price: 10, warmthBonus: 15, collectionId: 3 },
    { name: '星空壁纸', category: 'WALL', slotType: 'WALL', rarity: 3, priceType: 'GEMS', price: 12, warmthBonus: 18, collectionId: 3 },
    
    // 其他装饰
    { name: '可爱宠物', category: 'PET', slotType: 'EFFECT', rarity: 2, priceType: 'FISH', price: 8, warmthBonus: 10, collectionId: null },
    { name: '落地窗', category: 'HOUSE', slotType: 'WALL', rarity: 3, priceType: 'GEMS', price: 15, warmthBonus: 20, collectionId: null },
    { name: '毛绒玩具', category: 'PET', slotType: 'FURNITURE', rarity: 1, priceType: 'BONES', price: 35, warmthBonus: 4, collectionId: null },
    { name: '喷泉雕塑', category: 'EFFECT', slotType: 'EFFECT', rarity: 4, priceType: 'GEMS', price: 20, warmthBonus: 25, collectionId: null },
  ];

  for (const dec of decorationsWithCollection) {
    await prisma.decoration.create({
      data: dec,
    });
  }
  console.log('✅ 装饰物品创建成功 (17 件)');

  // 8. 创建任务
  await prisma.task.create({
    data: {
      relationshipId: relationship.id,
      guideId: guide.id,
      growerId: grower.id,
      name: '每日阅读',
      description: '每天阅读 30 分钟，提升自我',
      difficulty: 2,
      status: 'PENDING',
      proofType: 'TEXT',
      rewardConfig: JSON.stringify({ bones: 20, fish: 2 }),
    },
  });
  console.log('✅ 示例任务创建成功');

  // 9. 创建敏感词示例
  const sensitiveWords = [
    { word: '暴力', category: 'violence', level: 2 },
    { word: '赌博', category: 'gambling', level: 2 },
    { word: '毒品', category: 'drugs', level: 3 },
  ];
  for (const word of sensitiveWords) {
    await prisma.sensitiveWord.upsert({
      where: { word: word.word },
      update: {},
      create: word,
    });
  }
  console.log('✅ 敏感词创建成功');

  console.log('\n🎉 数据库初始化完成！');
  console.log('\n测试账号:');
  console.log('  管理员：admin / admin123');
  console.log('  引导者：guide / guide123');
  console.log('  成长者：grower / grower123');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
