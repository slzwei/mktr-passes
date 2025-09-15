import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create built-in templates if they don't exist
  const templates = [
    {
      id: 'stamp_card_v1',
      name: 'Stamp Card',
      style: 'generic',
      version: '1.0.0',
      schemaJson: {
        fields: [
          { key: 'primary', label: 'Store Name', value: 'Coffee Shop' },
          { key: 'secondary', label: 'Reward', value: 'Buy 10, Get 1 Free' },
          { key: 'auxiliary', label: 'Progress', value: '3 of 10 stamps' }
        ],
        colors: {
          backgroundColor: '#FFFFFF',
          foregroundColor: '#000000',
          labelColor: '#666666'
        },
        barcode: {
          message: 'STAMP123456',
          format: 'PKBarcodeFormatQR'
        }
      }
    },
    {
      id: 'coupon_v1',
      name: 'Coupon',
      style: 'coupon',
      version: '1.0.0',
      schemaJson: {
        fields: [
          { key: 'primary', label: 'Discount', value: '20% OFF' },
          { key: 'secondary', label: 'Valid Until', value: 'Dec 31, 2024' },
          { key: 'auxiliary', label: 'Code', value: 'SAVE20' }
        ],
        colors: {
          backgroundColor: '#FF6B6B',
          foregroundColor: '#FFFFFF',
          labelColor: '#FFE0E0'
        },
        barcode: {
          message: 'SAVE20',
          format: 'PKBarcodeFormatQR'
        }
      }
    },
    {
      id: 'membership_v1',
      name: 'Membership Card',
      style: 'membership',
      version: '1.0.0',
      schemaJson: {
        fields: [
          { key: 'primary', label: 'Member Name', value: 'John Doe' },
          { key: 'secondary', label: 'Member ID', value: 'M123456789' },
          { key: 'auxiliary', label: 'Tier', value: 'Gold Member' }
        ],
        colors: {
          backgroundColor: '#4ECDC4',
          foregroundColor: '#FFFFFF',
          labelColor: '#E0F7F6'
        },
        barcode: {
          message: 'M123456789',
          format: 'PKBarcodeFormatQR'
        }
      }
    }
  ];

  for (const template of templates) {
    const existing = await prisma.template.findUnique({
      where: { id: template.id }
    });

    if (!existing) {
      await prisma.template.create({
        data: template
      });
      console.log(`✅ Created template: ${template.name}`);
    } else {
      console.log(`⏭️  Template already exists: ${template.name}`);
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
