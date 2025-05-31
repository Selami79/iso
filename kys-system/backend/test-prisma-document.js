const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDocument() {
  try {
    // First check what fields the Document model expects
    const sampleDoc = {
      documentCode: 'TEST-001',
      document_name: 'Test Document',
      documentType: 'PROSEDÜR',
      owner_user_id: 2, // admin user
      categoryId: 1
    };
    
    console.log('Creating document with:', sampleDoc);
    
    const doc = await prisma.document.create({
      data: sampleDoc
    });
    
    console.log('Created document:', doc);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDocument();