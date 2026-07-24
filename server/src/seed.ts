import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@quotationstudio.com' },
    update: {},
    create: {
      email: 'admin@quotationstudio.com',
      passwordHash,
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create default currencies
  const currencies = [
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  // Create default rate tiers
  const tiers = [
    { name: 'Economical', description: 'Budget-friendly options', sortOrder: 1 },
    { name: 'Average', description: 'Standard quality options', sortOrder: 2 },
    { name: 'Good', description: 'Above average quality', sortOrder: 3 },
    { name: 'Premium', description: 'Top-tier premium options', sortOrder: 4 },
  ];

  const tierRecords: Record<string, string> = {};
  for (const tier of tiers) {
    const existing = await prisma.rateTier.findFirst({ where: { name: tier.name } });
    if (!existing) {
      const created = await prisma.rateTier.create({ data: tier });
      tierRecords[tier.name] = created.id;
    } else {
      tierRecords[tier.name] = existing.id;
    }
  }

  // Create default units
  const units = [
    { name: 'sq.ft', fullName: 'Square Feet' },
    { name: 'rft', fullName: 'Running Feet' },
    { name: 'nos', fullName: 'Numbers' },
    { name: 'kg', fullName: 'Kilograms' },
    { name: 'ltr', fullName: 'Litres' },
    { name: 'bag', fullName: 'Bags' },
    { name: 'lot', fullName: 'Lot/Lump Sum' },
    { name: 'cft', fullName: 'Cubic Feet' },
    { name: 'mtr', fullName: 'Meters' },
    { name: 'pair', fullName: 'Pairs' },
  ];

  const unitRecords: Record<string, string> = {};
  for (const unit of units) {
    const existing = await prisma.unit.findFirst({ where: { name: unit.name } });
    if (!existing) {
      const created = await prisma.unit.create({ data: unit });
      unitRecords[unit.name] = created.id;
    } else {
      unitRecords[unit.name] = existing.id;
    }
  }

  // Create default categories
  const categories = [
    { name: 'Flooring', description: 'All types of floor work', sortOrder: 1 },
    { name: 'Painting', description: 'Wall and ceiling paint work', sortOrder: 2 },
    { name: 'Electrical', description: 'Electrical fittings and wiring', sortOrder: 3 },
    { name: 'Plumbing', description: 'Plumbing and sanitary work', sortOrder: 4 },
    { name: 'Woodwork', description: 'Doors, windows and carpentry', sortOrder: 5 },
    { name: 'Civil Work', description: 'Brick, plaster, and concrete work', sortOrder: 6 },
    { name: 'False Ceiling', description: 'Gypsum and PVC ceiling work', sortOrder: 7 },
    { name: 'HVAC', description: 'Heating, ventilation and air conditioning', sortOrder: 8 },
  ];

  const categoryRecords: Record<string, string> = {};
  for (const category of categories) {
    const existing = await prisma.category.findFirst({ where: { name: category.name, deletedAt: null } });
    if (!existing) {
      const created = await prisma.category.create({ data: category });
      categoryRecords[category.name] = created.id;
    } else {
      categoryRecords[category.name] = existing.id;
    }
  }

  // Create sample brands
  const brands = [
    { name: 'Master Tiles', rateTierName: 'Economical', description: 'Local tile brand' },
    { name: 'Shabbir Tiles', rateTierName: 'Average', description: 'Mid-range tiles' },
    { name: 'RAK Ceramics', rateTierName: 'Good', description: 'Premium imported tiles' },
    { name: 'Porcelanosa', rateTierName: 'Premium', description: 'Luxury imported tiles' },
    { name: 'Nippon Paint', rateTierName: 'Average', description: 'Standard paints' },
    { name: 'Jotun', rateTierName: 'Good', description: 'Premium paints' },
    { name: 'Dulux', rateTierName: 'Premium', description: 'Top-tier paints' },
  ];

  for (const brand of brands) {
    const tierId = tierRecords[brand.rateTierName];
    if (tierId) {
      const existing = await prisma.brand.findFirst({
        where: { name: brand.name, rateTierId: tierId, deletedAt: null },
      });
      if (!existing) {
        await prisma.brand.create({
          data: {
            name: brand.name,
            description: brand.description,
            rateTierId: tierId,
          },
        });
      }
    }
  }

  // Create sample items with rates
  const sampleItems = [
    {
      title: 'Floor Tiles Installation',
      description: 'Supply and fix floor tiles including adhesive and grouting',
      categoryName: 'Flooring',
      unitName: 'sq.ft',
      rates: [
        { tierName: 'Economical', rate: 45 },
        { tierName: 'Average', rate: 75 },
        { tierName: 'Good', rate: 120 },
        { tierName: 'Premium', rate: 200 },
      ],
    },
    {
      title: 'Wall Paint (2 Coats)',
      description: 'Wall preparation, primer and 2 coats of emulsion paint',
      categoryName: 'Painting',
      unitName: 'sq.ft',
      rates: [
        { tierName: 'Economical', rate: 12 },
        { tierName: 'Average', rate: 18 },
        { tierName: 'Good', rate: 28 },
        { tierName: 'Premium', rate: 45 },
      ],
    },
    {
      title: 'Electrical Point',
      description: 'Complete electrical point with wiring, switch and socket',
      categoryName: 'Electrical',
      unitName: 'nos',
      rates: [
        { tierName: 'Economical', rate: 800 },
        { tierName: 'Average', rate: 1200 },
        { tierName: 'Good', rate: 1800 },
        { tierName: 'Premium', rate: 2500 },
      ],
    },
    {
      title: 'Gypsum False Ceiling',
      description: 'Gypsum board false ceiling with metal framework',
      categoryName: 'False Ceiling',
      unitName: 'sq.ft',
      rates: [
        { tierName: 'Economical', rate: 55 },
        { tierName: 'Average', rate: 80 },
        { tierName: 'Good', rate: 110 },
        { tierName: 'Premium', rate: 160 },
      ],
    },
    {
      title: 'Flush Door (7ft x 3ft)',
      description: 'Flush door with frame, hinges and standard lock',
      categoryName: 'Woodwork',
      unitName: 'nos',
      rates: [
        { tierName: 'Economical', rate: 12000 },
        { tierName: 'Average', rate: 18000 },
        { tierName: 'Good', rate: 28000 },
        { tierName: 'Premium', rate: 45000 },
      ],
    },
  ];

  for (const item of sampleItems) {
    const categoryId = categoryRecords[item.categoryName];
    const unitId = unitRecords[item.unitName];

    if (!categoryId || !unitId) continue;

    const existing = await prisma.item.findFirst({
      where: { title: item.title, categoryId, deletedAt: null },
    });

    if (!existing) {
      await prisma.item.create({
        data: {
          title: item.title,
          description: item.description,
          categoryId,
          unitId,
          rates: {
            create: item.rates
              .filter((r) => tierRecords[r.tierName])
              .map((r) => ({
                rateTierId: tierRecords[r.tierName],
                rate: r.rate,
              })),
          },
        },
      });
    }
  }

  // Create sample customers
  const customers = [
    {
      name: 'Ahmed Khan',
      email: 'ahmed.khan@example.com',
      phone: '+92-300-1234567',
      address: 'DHA Phase 6, Lahore',
      company: 'Khan Developers',
    },
    {
      name: 'Sara Ali',
      email: 'sara.ali@example.com',
      phone: '+92-321-9876543',
      address: 'Gulberg III, Lahore',
    },
    {
      name: 'Usman Sheikh',
      email: 'usman@sheikhgroup.com',
      phone: '+92-333-5551234',
      address: 'Bahria Town, Islamabad',
      company: 'Sheikh Group',
    },
  ];

  for (const customer of customers) {
    const existing = await prisma.customer.findFirst({
      where: { email: customer.email, deletedAt: null },
    });
    if (!existing) {
      await prisma.customer.create({ data: customer });
    }
  }

  // Create company settings
  const settingsExist = await prisma.companySettings.findFirst();
  if (!settingsExist) {
    await prisma.companySettings.create({
      data: {
        companyName: 'My Construction Company',
        defaultCurrency: 'PKR',
        defaultTaxPercent: 0,
        defaultExpiryDays: 15,
        termsAndConditions:
          '1. Rates are valid for 15 days from the date of quotation.\n2. 50% advance payment required before work commencement.\n3. Material rates may vary based on market conditions.\n4. Work timeline will be confirmed after order confirmation.',
      },
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
