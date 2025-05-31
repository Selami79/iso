const { PrismaClient } = require('@prisma/client');

// Print the Document model's create input type
console.log('Document model fields:');
const prisma = new PrismaClient();

// Create a dummy document to see what fields are expected
try {
  const dummy = {};
  // This will fail but show us what fields are expected
  prisma.document.create({ data: dummy });
} catch (e) {
  // This is expected to fail
}

// Try to list actual fields in DB
async function checkDB() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position;
    `;
    console.log('\nActual database columns:');
    console.log(result);
  } catch (error) {
    console.error('DB Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();