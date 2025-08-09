const axios = require('axios');

async function testDataExplorer() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Testing D-Climate Data Explorer...\n');
  
  try {
    // Step 1: Test hierarchical region filtering
    console.log('🌏 1. Testing Region Hierarchy Filtering...');
    
    // Country level
    const countryResponse = await axios.get(`${baseUrl}/api/data/explore`, {
      params: {
        region: 'Malaysia',
        timeRange: 'today'
      }
    });
    console.log('✅ Country-level data retrieved!');
    console.log('Malaysia data:', JSON.stringify(countryResponse.data, null, 2));
    console.log('');
    
    // State level
    const stateResponse = await axios.get(`${baseUrl}/api/data/explore`, {
      params: {
        region: 'Malaysia/Selangor',
        timeRange: 'today'
      }
    });
    console.log('✅ State-level data retrieved!');
    console.log('Selangor data:', JSON.stringify(stateResponse.data, null, 2));
    console.log('');
    
    // Step 2: Test time range filtering
    console.log('⏰ 2. Testing Time Range Filtering...');
    const timeRanges = ['today', 'weekly', 'monthly', 'quarterly'];
    
    for (const range of timeRanges) {
      const timeResponse = await axios.get(`${baseUrl}/api/data/explore`, {
        params: {
          region: 'Malaysia',
          timeRange: range,
          limit: 5
        }
      });
      console.log(`✅ ${range} data retrieved!`);
      console.log(`${range} summary:`, {
        dataCount: timeResponse.data.data?.length || 0,
        avgTemp: timeResponse.data.aggregations?.averageTemperature || 'N/A',
        avgCO2: timeResponse.data.aggregations?.averageCO2 || 'N/A'
      });
    }
    console.log('');
    
    // Step 3: Test data pagination
    console.log('📄 3. Testing Data Pagination...');
    const paginationResponse = await axios.get(`${baseUrl}/api/data/explore`, {
      params: {
        region: 'Malaysia',
        timeRange: 'monthly',
        page: 1,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }
    });
    console.log('✅ Paginated data retrieved!');
    console.log('Pagination info:', {
      totalItems: paginationResponse.data.pagination?.total || 0,
      currentPage: paginationResponse.data.pagination?.page || 1,
      totalPages: paginationResponse.data.pagination?.pages || 1,
      itemsReturned: paginationResponse.data.data?.length || 0
    });
    console.log('');
    
    // Step 4: Test data export
    console.log('📊 4. Testing Data Export...');
    const exportResponse = await axios.get(`${baseUrl}/api/data/export`, {
      params: {
        region: 'Malaysia/Selangor',
        timeRange: 'weekly',
        format: 'csv',
        includeMetadata: true
      }
    });
    console.log('✅ Data export successful!');
    console.log('Export details:', {
      format: exportResponse.data.format || 'csv',
      recordCount: exportResponse.data.recordCount || 0,
      fileSize: exportResponse.data.fileSize || 'Unknown',
      downloadUrl: exportResponse.data.downloadUrl || 'Generated'
    });
    console.log('');
    
    // Step 5: Test real-time data updates
    console.log('🔄 5. Testing Real-time Data Updates...');
    const realtimeResponse = await axios.get(`${baseUrl}/api/data/realtime`, {
      params: {
        region: 'Malaysia',
        lastUpdate: Math.floor(Date.now() / 1000) - 300 // 5 minutes ago
      }
    });
    console.log('✅ Real-time updates retrieved!');
    console.log('Real-time summary:', {
      newDataPoints: realtimeResponse.data.newData?.length || 0,
      lastUpdate: new Date(realtimeResponse.data.lastUpdate * 1000).toISOString(),
      activeStreams: realtimeResponse.data.activeStreams || 0
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDataExplorer();