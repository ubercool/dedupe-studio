const DedupeEngine = require('./lib/dedupe-engine');
const fs = require('fs');

// Sample test data with common duplicate scenarios
const testRecords = [
  // Benjamin/Ben variations
  { firstName: 'Benjamin', lastName: 'Smith', email: 'ben.smith@gmail.com', company: 'Tech Corp' },
  { firstName: 'Ben', lastName: 'Smith', email: 'ben.smith@gmail.com', company: 'Tech Corp' },
  { firstName: 'Benny', lastName: 'Smith', email: 'b.smith@techcorp.com', company: 'Tech Corporation' },
  
  // Robert/Bob variations
  { firstName: 'Robert', lastName: 'Johnson', email: 'rjohnson@email.com', company: 'ABC Company' },
  { firstName: 'Bob', lastName: 'Johnson', email: 'bob.j@abc.com', company: 'ABC Co.' },
  
  // Timothy/Tim variations
  { firstName: 'Timothy', lastName: 'Choate', email: 'tim@aptimus.com', company: 'Aptimus Inc.' },
  { firstName: 'Tim', lastName: 'Choate', email: 'tchoate@aptimus.com', company: 'Aptimus Inc' },
  
  // Clean records (no duplicates)
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah@email.com', company: 'XYZ Ltd' },
  { firstName: 'Michael', lastName: 'Brown', email: 'mbrown@company.com', company: 'StartUp Co' },
  
  // William/Bill variations
  { firstName: 'William', lastName: 'Davis', email: 'wdavis@email.com', company: 'Global Inc' },
  { firstName: 'Bill', lastName: 'Davis', email: 'bill.davis@global.com', company: 'Global Incorporated' },
  
  // Same name, different person
  { firstName: 'John', lastName: 'Smith', email: 'john1@company1.com', company: 'Company One' },
  { firstName: 'John', lastName: 'Smith', email: 'john2@company2.com', company: 'Company Two' }
];

console.log('🔍 DEDUPE ENGINE TEST - Powered by Fuzzball.js');
console.log('===============================================\n');

// Initialize the engine
const engine = new DedupeEngine({
  threshold: 75,  // 75% similarity threshold
  weights: {
    firstName: 0.35,
    lastName: 0.25,
    email: 0.25,
    company: 0.15
  }
});

// Run deduplication
console.log(`📊 Processing ${testRecords.length} records...\n`);
const results = engine.dedupeRecords(testRecords);

// Display results
console.log('🎯 DUPLICATE GROUPS FOUND:');
console.log('==========================\n');

results.clusters.forEach((cluster, idx) => {
  console.log(`Group ${idx + 1} (${cluster.confidence}% confidence)`);
  console.log(`Reason: ${cluster.reason}`);
  console.log('Records:');
  
  cluster.indices.forEach(recordIdx => {
    const record = testRecords[recordIdx];
    console.log(`  - ${record.firstName} ${record.lastName} (${record.email}) at ${record.company}`);
  });
  
  console.log('');
});

// Summary statistics
console.log('📈 SUMMARY:');
console.log('===========');
console.log(`Total records: ${results.summary.totalRecords}`);
console.log(`Duplicate pairs found: ${results.summary.duplicatesFound}`);
console.log(`Duplicate groups: ${results.summary.clustersFound}`);
console.log(`Records affected: ${results.summary.recordsAffected}`);
console.log(`Records removed: ${results.removedCount}`);
console.log(`Clean records remaining: ${results.cleanRecords.length}\n`);

// Show clean list
console.log('✅ CLEAN RECORDS:');
console.log('=================');
results.cleanRecords.forEach(record => {
  console.log(`- ${record.firstName} ${record.lastName} (${record.company})`);
});

// Save results to file
const output = {
  timestamp: new Date().toISOString(),
  originalCount: testRecords.length,
  cleanCount: results.cleanRecords.length,
  removedCount: results.removedCount,
  results: results
};

fs.writeFileSync('dedupe-results.json', JSON.stringify(output, null, 2));
console.log('\n💾 Results saved to dedupe-results.json');
console.log('✨ Fuzzy matching engine is working!\n');
