const fs = require('fs');
const Papa = require('papaparse');
const DedupeEngine = require('./lib/dedupe-engine');

// Get filename from command line
const filename = process.argv[2];

if (!filename) {
  console.log('Usage: node process-csv.js <filename.csv>');
  process.exit(1);
}

// Read and parse CSV
const csvFile = fs.readFileSync(filename, 'utf8');

Papa.parse(csvFile, {
  header: true,
  complete: (results) => {
    console.log(`\n📄 Loaded ${results.data.length} records from ${filename}\n`);
    
    // Initialize dedupe engine
    const engine = new DedupeEngine({
      threshold: 75
    });
    
    // Process records
    const dedupeResults = engine.dedupeRecords(results.data);
    
    // Show results
    console.log('🎯 DUPLICATE GROUPS:');
    console.log('===================\n');
    
    dedupeResults.clusters.forEach((cluster, idx) => {
      console.log(`Group ${idx + 1} (${cluster.confidence}% match)`);
      cluster.indices.forEach(i => {
        const r = results.data[i];
        console.log(`  - ${r.firstName || r.first_name || ''} ${r.lastName || r.last_name || ''}`);
      });
      console.log('');
    });
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`Total: ${dedupeResults.summary.totalRecords} records`);
    console.log(`Duplicates: ${dedupeResults.summary.recordsAffected} records`);
    console.log(`Clean: ${dedupeResults.summary.totalRecords - dedupeResults.summary.recordsAffected} records`);
    
    // Save clean data
    const cleanRecords = results.data.filter((record, idx) => {
      return !dedupeResults.clusters.some(cluster => 
        cluster.indices.includes(idx) && cluster.indices[0] !== idx
      );
    });
    
    const outputFilename = filename.replace('.csv', '_cleaned.csv');
    const csv = Papa.unparse(cleanRecords);
    fs.writeFileSync(outputFilename, csv);
    console.log(`\n✅ Clean data saved to ${outputFilename}`);
  },
  error: (err) => {
    console.error('Error parsing CSV:', err);
  }
});
