// Simple unit tests for Pokemon name formatting
// Run with Node.js: node test.js

const fs = require('fs');

function loadData() {
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  return data;
}

function testDataIntegrity() {
  const data = loadData();
  let passed = 0;
  let failed = 0;

  // Check total number of entries
  const totalEntries = Object.keys(data).length;
  if (totalEntries === 1025) {
    console.log('✓ Total entries: 1025');
    passed++;
  } else {
    console.log(`✗ Expected 1025 entries, got ${totalEntries}`);
    failed++;
  }

  // Check for sequential keys from 001 to 1025
  for (let i = 1; i <= 1025; i++) {
    const key = String(i).padStart(3, '0');
    if (!data[key]) {
      console.log(`✗ Missing entry: ${key}`);
      failed++;
    }
  }
  if (failed === 0) {
    console.log('✓ All entries from 001 to 1025 present');
    passed++;
  }

  console.log(`\nData Integrity Test - Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

function testNoDuplicatesInVariants() {
  const data = loadData();
  let passed = 0;
  let failed = 0;

  for (const key in data) {
    const entry = data[key];
    if (entry.variants) {
      const labels = entry.variants.map(v => v.label);
      const uniqueLabels = new Set(labels);
      if (labels.length === uniqueLabels.size) {
        passed++;
      } else {
        console.log(`✗ ${key}: ${entry.name} has duplicate variants: ${labels}`);
        failed++;
      }
    } else {
      passed++; // No variants, so no duplicates
    }
  }

  console.log(`\nNo Duplicates Test - Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

function testNameFormatting() {
  const data = loadData();
  const tests = [
    { key: '122', expected: 'Mr. Mime' },
    { key: '029', expected: 'Nidoran♀' },
    { key: '032', expected: 'Nidoran♂' },
    { key: '782', expected: 'Jangmo-o' },
    { key: '785', expected: 'Tapu Koko' }, // Assuming Tapu Koko is in data
    { key: '849', expected: 'Toxtricity' },
    { key: '001', expected: 'Bulbasaur' },
    { key: '150', expected: 'Mewtwo' },
    { key: '151', expected: 'Mew' },
    { key: '144', expected: 'Articuno' },
    { key: '145', expected: 'Zapdos' },
    { key: '146', expected: 'Moltres' },
    { key: '243', expected: 'Raikou' },
    { key: '244', expected: 'Entei' },
    { key: '245', expected: 'Suicune' },
    { key: '377', expected: 'Regirock' },
    { key: '378', expected: 'Regice' },
    { key: '379', expected: 'Registeel' },
    { key: '380', expected: 'Latias' },
    { key: '381', expected: 'Latios' },
    { key: '382', expected: 'Kyogre' },
    { key: '383', expected: 'Groudon' },
    { key: '384', expected: 'Rayquaza' },
    { key: '385', expected: 'Jirachi' },
    { key: '386', expected: 'Deoxys' },
    { key: '479', expected: 'Rotom' },
    { key: '480', expected: 'Uxie' },
    { key: '481', expected: 'Mesprit' },
    { key: '482', expected: 'Azelf' },
    { key: '483', expected: 'Dialga' },
    { key: '484', expected: 'Palkia' },
    { key: '485', expected: 'Heatran' },
    { key: '486', expected: 'Regigigas' },
    { key: '487', expected: 'Giratina' },
    { key: '488', expected: 'Cresselia' },
    { key: '489', expected: 'Phione' },
    { key: '490', expected: 'Manaphy' },
    { key: '491', expected: 'Darkrai' },
    { key: '492', expected: 'Shaymin' },
    { key: '493', expected: 'Arceus' },
    { key: '494', expected: 'Victini' },
    { key: '638', expected: 'Cobalion' },
    { key: '639', expected: 'Terrakion' },
    { key: '640', expected: 'Virizion' },
    { key: '641', expected: 'Tornadus' },
    { key: '642', expected: 'Thundurus' },
    { key: '643', expected: 'Reshiram' },
    { key: '644', expected: 'Zekrom' },
    { key: '645', expected: 'Landorus' },
    { key: '646', expected: 'Kyurem' },
    { key: '647', expected: 'Keldeo' },
    { key: '648', expected: 'Meloetta' },
    { key: '649', expected: 'Genesect' },
    { key: '716', expected: 'Xerneas' },
    { key: '717', expected: 'Yveltal' },
    { key: '718', expected: 'Zygarde' },
    { key: '719', expected: 'Diancie' },
    { key: '720', expected: 'Hoopa' },
    { key: '721', expected: 'Volcanion' },
    { key: '789', expected: 'Cosmog' },
    { key: '790', expected: 'Cosmoem' },
    { key: '791', expected: 'Solgaleo' },
    { key: '792', expected: 'Lunala' },
    { key: '800', expected: 'Necrozma' },
    { key: '807', expected: 'Zeraora' },
    { key: '808', expected: 'Meltan' },
    { key: '809', expected: 'Melmetal' },
    { key: '893', expected: 'Zarude' },
    { key: '894', expected: 'Regieleki' },
    { key: '895', expected: 'Regidrago' },
    { key: '896', expected: 'Glastrier' },
    { key: '897', expected: 'Spectrier' },
    { key: '898', expected: 'Calyrex' },
    { key: '905', expected: 'Enamorus' },
    { key: '1001', expected: 'Wo-Chien' },
    { key: '1002', expected: 'Chien-Pao' },
    { key: '1003', expected: 'Ting-Lu' },
    { key: '1004', expected: 'Chi-Yu' },
    { key: '1005', expected: 'Roaring Moon' },
    { key: '1006', expected: 'Iron Valiant' },
    { key: '1007', expected: 'Koraidon' },
    { key: '1008', expected: 'Miraidon' },
    { key: '1009', expected: 'Walking Wake' },
    { key: '1010', expected: 'Iron Leaves' },
    { key: '1011', expected: 'Dipplin' },
    { key: '1012', expected: 'Poltchageist' },
    { key: '1013', expected: 'Sinistcha' },
    { key: '1014', expected: 'Okidogi' },
    { key: '1015', expected: 'Munkidori' },
    { key: '1016', expected: 'Fezandipiti' },
    { key: '1017', expected: 'Ogerpon' },
    { key: '1018', expected: 'Archaludon' },
    { key: '1019', expected: 'Hydrapple' },
    { key: '1020', expected: 'Gouging Fire' },
    { key: '1021', expected: 'Raging Bolt' },
    { key: '1022', expected: 'Iron Boulder' },
    { key: '1023', expected: 'Iron Crown' },
    { key: '1024', expected: 'Terapagos' },
    { key: '1025', expected: 'Pecharunt' }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    if (data[test.key] && data[test.key].name === test.expected) {
      console.log(`✓ ${test.key}: ${test.expected}`);
      passed++;
    } else if (data[test.key]) {
      console.log(`✗ ${test.key}: Expected ${test.expected}, got ${data[test.key].name}`);
      failed++;
    } else {
      // Skip if key not in data
      passed++;
    }
  });

  console.log(`\nPassed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

testDataIntegrity();
testNoDuplicatesInVariants();
testNameFormatting();