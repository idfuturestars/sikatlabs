const fs = require('fs'); const readline = require('readline');
(async ()=>{
  const rl = readline.createInterface({ input: fs.createReadStream('seedData.csv') });
  let i=0;
  for await (const line of rl) {
    if (!i++) continue; // skip header
    if (i % 250000 === 0) console.log('Ingest preview progressed to line', i);
    // Here you would batch-insert into DB; for demo, we noop.
  }
  console.log('Ingest preview done:', i-1, 'rows scanned');
})();