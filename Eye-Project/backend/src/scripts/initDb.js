import bcrypt from 'bcrypt'
import { sequelize } from '../config/db.js'
import { env } from '../config/env.js'
import { User, Equipment } from '../models/index.js'

const sampleEquipment = [
  {
    barcode: 'EQ0001',
    category: 'ตลับดรัม (แท้)',
    name: 'Drum Cartridge for Xerox (Lexmark) 236/286/336 350i/450i/550i 2005/2055/3005/3007 5010 5222/5225/5230',
  },
  {
    barcode: 'EQ0002',
    category: 'แกนฟองน้ำ (แบบเกลียว)',
    name: 'Cleaning Roller PCR for Xerox C2270/2275 3370/3371/3373/3375 4470/4475/5570/5575 7535/7545/7556/78xx',
  },
  {
    barcode: 'EQ0003',
    category: 'แกนฟองน้ำ (แบบเต็มแกน)',
    name: 'Cleaning Roller PCR for Xerox C2270/2275 3370/3371/3375 4470/4475/5570/5575 7535/7545/7556/78xx',
  },
  {
    barcode: 'EQ0004',
    category: 'ชิปหมึก',
    name: 'Chip for Xerox (NA*W.EU) WC7525/7530/7535/7545/7556 7830/7835/7845/7855/7970 C8030/C8035/C8045/C8055',
  },
  {
    barcode: 'EQ0005',
    category: 'ชิปดรัม',
    name: 'Chip for Xerox 7525/7530/7535/7545/7556 7830/7835/7845/7855/7970 C8030/C8035/C8045/C8055',
  },
  { barcode: 'EQ0006', category: 'ชิปหมึก', name: 'Chip for Xerox WC5325/5330/5335' },
  { barcode: 'EQ0007', category: 'ชิปดรัม', name: 'Chip for Xerox WC5325/5330/5335' },
  {
    barcode: 'EQ0008',
    category: 'ชิปหมึก (Metered)',
    name: 'Chip for Xerox (Metered) 7525/7530/7535/7545/7556 7830/7835/7845/7855/7970 EC7836/EC7856 C8030/C8035',
  },
  {
    barcode: 'EQ0009',
    category: 'ชิปดรัม (Metered)',
    name: 'Chip for Xerox (Metered) 7525/7530/7535/7545/7556 7830/7835/7845/7855/7970 EC7836/EC7856 C8030/C8035',
  },
  {
    barcode: 'EQ0010',
    category: 'ชิปหมึก',
    name: 'Chip for Xerox (NA/W.EU) C8130/C8135/C8145/C8155/C8170',
  },
  {
    barcode: 'EQ0011',
    category: 'ชิปดรัม',
    name: 'Chip for Xerox (NA/W.EU) C8130/C8135/C8145/C8155/C8170',
  },
]

async function run() {
  await sequelize.authenticate()
  await sequelize.sync()

  const equipmentCount = await Equipment.count()
  if (equipmentCount === 0) {
    await Equipment.bulkCreate(
      sampleEquipment.map((item) => ({ ...item, unit: 'ชิ้น', stockQty: 20, lowStockThreshold: 5 })),
    )
    console.log(`Seeded ${sampleEquipment.length} sample equipment items.`)
  } else {
    console.log('Equipment table already has data, skipping equipment seed.')
  }

  if (!env.seedAdminEmail || !env.seedAdminPassword) {
    console.log('Tables synced. Set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD in .env to seed an admin user.')
    return
  }

  const existing = await User.findOne({ where: { email: env.seedAdminEmail } })
  if (existing) {
    console.log(`Admin user ${env.seedAdminEmail} already exists, skipping seed.`)
    return
  }

  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
  await User.create({
    name: env.seedAdminName,
    email: env.seedAdminEmail,
    passwordHash,
    role: 'admin',
  })

  console.log(`Seeded admin user: ${env.seedAdminEmail}`)
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Database init failed:', err)
    process.exit(1)
  })
