// CAPA Module Test Script
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!'
};

const testCapa = {
  capaNumber: 'CAPA-TEST-001',
  capaType: 'CORRECTIVE',
  title: 'Test Düzeltici Faaliyet',
  description: 'Bu bir test düzeltici faaliyet kaydıdır. Sistem testleri için oluşturulmuştur.',
  sourceId: 1,
  sourceReference: 'TEST-REF-001',
  detectedDate: new Date().toISOString(),
  targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  detectedByUserId: 1,
  responsibleUserId: 1,
  priority: 'HIGH',
  rootCauseAnalysis: 'Test kök neden analizi',
  proposedActions: 'Test önerilen faaliyetler',
  costEstimate: 1500.00,
  recurrencePrevention: 'Test tekrarlanma önleme'
};

const testActionItem = {
  actionDescription: 'Test faaliyet maddesi açıklaması',
  assignedToUserId: 1,
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
  status: 'PENDING'
};

async function runTests() {
  console.log('🚀 CAPA Module Test Başlatılıyor...\n');

  try {
    // Test 1: Authentication
    console.log('1️⃣ Authentication Test...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
      authToken = authResponse.data.token;
      console.log('✅ Authentication başarılı');
    } catch (error) {
      console.log('⚠️ Authentication atlanıyor (kullanıcı bulunamadı)');
      // For testing without auth, we'll continue
    }

    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // Test 2: Get CAPA Statistics
    console.log('\n2️⃣ CAPA İstatistikleri Test...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/capa/statistics`, { headers });
      console.log('✅ CAPA istatistikleri alındı:', statsResponse.data.data);
    } catch (error) {
      console.log('❌ CAPA istatistikleri alınamadı:', error.response?.data?.error || error.message);
    }

    // Test 3: Get Nonconformity Sources
    console.log('\n3️⃣ Uygunsuzluk Kaynakları Test...');
    try {
      const sourcesResponse = await axios.get(`${BASE_URL}/capa/sources`, { headers });
      console.log('✅ Uygunsuzluk kaynakları alındı:', sourcesResponse.data.data);
    } catch (error) {
      console.log('❌ Uygunsuzluk kaynakları alınamadı:', error.response?.data?.error || error.message);
    }

    // Test 4: Create CAPA Record
    console.log('\n4️⃣ CAPA Kaydı Oluşturma Test...');
    let createdCapaId = null;
    try {
      const createResponse = await axios.post(`${BASE_URL}/capa`, testCapa, { headers });
      createdCapaId = createResponse.data.data.id;
      console.log('✅ CAPA kaydı oluşturuldu:', createResponse.data.data);
    } catch (error) {
      console.log('❌ CAPA kaydı oluşturulamadı:', error.response?.data?.error || error.message);
    }

    // Test 5: Get All CAPAs
    console.log('\n5️⃣ Tüm CAPA Kayıtları Test...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/capa?page=1&limit=10`, { headers });
      console.log('✅ CAPA kayıtları alındı:', {
        total: listResponse.data.data.pagination.total,
        kayitSayisi: listResponse.data.data.capas.length
      });
    } catch (error) {
      console.log('❌ CAPA kayıtları alınamadı:', error.response?.data?.error || error.message);
    }

    // Test 6: Get CAPA by ID (if created)
    if (createdCapaId) {
      console.log('\n6️⃣ CAPA Detay Test...');
      try {
        const detailResponse = await axios.get(`${BASE_URL}/capa/${createdCapaId}`, { headers });
        console.log('✅ CAPA detayı alındı:', detailResponse.data.data.capaNumber);
      } catch (error) {
        console.log('❌ CAPA detayı alınamadı:', error.response?.data?.error || error.message);
      }

      // Test 7: Update CAPA
      console.log('\n7️⃣ CAPA Güncelleme Test...');
      try {
        const updateData = {
          status: 'IN_PROGRESS',
          rootCauseAnalysis: 'Güncellenmiş kök neden analizi'
        };
        const updateResponse = await axios.put(`${BASE_URL}/capa/${createdCapaId}`, updateData, { headers });
        console.log('✅ CAPA güncellendi:', updateResponse.data.data.status);
      } catch (error) {
        console.log('❌ CAPA güncellenemedi:', error.response?.data?.error || error.message);
      }

      // Test 8: Create Action Item
      console.log('\n8️⃣ Faaliyet Maddesi Oluşturma Test...');
      let createdActionItemId = null;
      try {
        const actionItemData = { ...testActionItem, capaId: createdCapaId };
        const actionResponse = await axios.post(`${BASE_URL}/capa/action-items`, actionItemData, { headers });
        createdActionItemId = actionResponse.data.data.id;
        console.log('✅ Faaliyet maddesi oluşturuldu:', actionResponse.data.data.actionDescription);
      } catch (error) {
        console.log('❌ Faaliyet maddesi oluşturulamadı:', error.response?.data?.error || error.message);
      }

      // Test 9: Update Action Item
      if (createdActionItemId) {
        console.log('\n9️⃣ Faaliyet Maddesi Güncelleme Test...');
        try {
          const actionUpdateData = {
            status: 'IN_PROGRESS',
            completionNotes: 'Faaliyet başlatıldı'
          };
          const actionUpdateResponse = await axios.put(`${BASE_URL}/capa/action-items/${createdActionItemId}`, actionUpdateData, { headers });
          console.log('✅ Faaliyet maddesi güncellendi:', actionUpdateResponse.data.data.status);
        } catch (error) {
          console.log('❌ Faaliyet maddesi güncellenemedi:', error.response?.data?.error || error.message);
        }
      }

      // Test 10: Verify Effectiveness
      console.log('\n🔟 Etkinlik Doğrulama Test...');
      try {
        const verificationData = {
          effectivenessVerified: true,
          verificationComments: 'Test etkinlik doğrulaması başarılı',
          effectivenessCheckDate: new Date().toISOString()
        };
        const verifyResponse = await axios.post(`${BASE_URL}/capa/${createdCapaId}/verify`, verificationData, { headers });
        console.log('✅ Etkinlik doğrulandı:', verifyResponse.data.message);
      } catch (error) {
        console.log('❌ Etkinlik doğrulanamadı:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎉 CAPA Module Test Tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test sırasında beklenmeyen hata:', error.message);
  }
}

// Test filtering
async function runFilterTests() {
  console.log('\n🔍 CAPA Filtreleme Testleri...');
  
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  
  // Test different filters
  const filterTests = [
    { name: 'Status Filter', params: '?status=OPEN' },
    { name: 'CAPA Type Filter', params: '?capaType=CORRECTIVE' },
    { name: 'Priority Filter', params: '?priority=HIGH' },
    { name: 'Search Filter', params: '?search=test' },
    { name: 'Date Range Filter', params: `?dateFrom=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&dateTo=${new Date().toISOString()}` }
  ];

  for (const test of filterTests) {
    try {
      const response = await axios.get(`${BASE_URL}/capa${test.params}`, { headers });
      console.log(`✅ ${test.name}: ${response.data.data.pagination.total} kayıt bulundu`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Run all tests
async function main() {
  await runTests();
  await runFilterTests();
}

main().catch(console.error);