/**
 * Test Search API
 * 
 * Quick script to test search endpoints
 * Run after: npm run seed && cd generated && npm run dev
 */

const BASE_URL = 'http://localhost:3000/api'

async function testSearch(endpoint, params = {}) {
  const url = new URL(endpoint, BASE_URL)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })
  
  console.log(`\n📡 Testing: ${url.pathname}${url.search}`)
  
  try {
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (!response.ok) {
      console.error(`❌ Error: ${data.error}`)
      return
    }
    
    console.log(`✅ Success:`)
    console.log(`   Query: "${params.q}"`)
    console.log(`   Total: ${data.pagination?.total || data.results?.length || 0}`)
    console.log(`   Results: ${data.results?.length || 0}`)
    
    if (data.results && data.results.length > 0) {
      const first = data.results[0]
      console.log(`\n   Top Result:`)
      console.log(`   - Name: ${first.data?.name || first.data?.title || first.data?.email || 'N/A'}`)
      console.log(`   - Score: ${first.score}`)
      console.log(`   - Matches: ${first.matches.map(m => `${m.field}:${m.type}`).join(', ')}`)
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message)
  }
}

async function runTests() {
  console.log('🔍 Testing Full-Text Search API\n')
  console.log('=' .repeat(60))
  
  // Test 1: Search products
  await testSearch('/search', {
    q: 'laptop',
    model: 'product',
    limit: 10
  })
  
  // Test 2: Search products with sorting
  await testSearch('/search', {
    q: 'gaming',
    model: 'product',
    sort: 'popular'
  })
  
  // Test 3: Search users
  await testSearch('/search', {
    q: 'john',
    model: 'user'
  })
  
  // Test 4: Search blog posts
  await testSearch('/search', {
    q: 'typescript',
    model: 'blogpost'
  })
  
  // Test 5: Search reviews
  await testSearch('/search', {
    q: 'excellent',
    model: 'review'
  })
  
  // Test 6: Federated search
  console.log(`\n${'='.repeat(60)}`)
  console.log(`\n📡 Testing: /search/all?q=gaming`)
  
  try {
    const response = await fetch(`${BASE_URL}/search/all?q=gaming`)
    const data = await response.json()
    
    if (!response.ok) {
      console.error(`❌ Error: ${data.error}`)
    } else {
      console.log(`✅ Federated Search Success:`)
      console.log(`   Query: "gaming"`)
      console.log(`   Total Results: ${data.pagination?.total || 0}`)
      console.log(`   Models Searched: ${data.pagination?.modelsSearched || 0}`)
      
      data.results?.forEach(modelResults => {
        console.log(`\n   ${modelResults.model}: ${modelResults.results.length} results`)
        if (modelResults.results.length > 0) {
          const top = modelResults.results[0]
          console.log(`   - Top: ${top.data?.name || top.data?.title || 'N/A'} (score: ${top.score})`)
        }
      })
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message)
  }
  
  // Test 7: Pagination
  await testSearch('/search', {
    q: 'gaming',
    model: 'product',
    limit: 2,
    skip: 0
  })
  
  // Test 8: Min score filtering
  await testSearch('/search', {
    q: 'usb',
    model: 'product',
    minScore: 5
  })
  
  // Test 9: Word boundary matching
  await testSearch('/search', {
    q: 'mouse',
    model: 'product'
  })
  
  // Test 10: Recent sorting
  await testSearch('/search', {
    q: 'laptop',
    model: 'product',
    sort: 'recent'
  })
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`\n✅ All tests complete!`)
  console.log(`\n💡 Tips:`)
  console.log(`   - Try different queries to see scoring in action`)
  console.log(`   - Compare 'relevance' vs 'popular' vs 'recent' sorting`)
  console.log(`   - Test pagination with skip/limit`)
  console.log(`   - Use minScore to filter weak matches`)
  console.log(`   - Try federated search to find across all models`)
}

runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

