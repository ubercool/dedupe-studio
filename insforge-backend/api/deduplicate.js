// Import dependencies using npm: specifier for Deno
import fuzz from 'npm:fuzzball@2.2.3';
import Papa from 'npm:papaparse@5.5.3';

// Nickname mappings for name comparison
const NICKNAME_MAP = {
  'abraham': ['abe', 'bram', 'ham'],
  'alexander': ['alex', 'al', 'xander', 'lex', 'sandy'],
  'andrew': ['andy', 'drew'],
  'anthony': ['tony', 'ant'],
  'benjamin': ['ben', 'benny', 'benji', 'bennie'],
  'charles': ['charlie', 'chuck', 'chas', 'charley'],
  'christopher': ['chris', 'kit', 'topher'],
  'daniel': ['dan', 'danny'],
  'david': ['dave', 'davey'],
  'donald': ['don', 'donnie'],
  'edward': ['ed', 'eddie', 'ted', 'ned'],
  'frederick': ['fred', 'freddy', 'rick'],
  'gerald': ['jerry', 'gerry'],
  'gregory': ['greg', 'gregg'],
  'harold': ['harry', 'hal'],
  'henry': ['hank', 'harry', 'hal'],
  'james': ['jim', 'jimmy', 'jamie', 'jay'],
  'john': ['jack', 'johnny', 'jon'],
  'jonathan': ['jon', 'nathan', 'nate'],
  'joseph': ['joe', 'joey', 'jo'],
  'joshua': ['josh'],
  'kenneth': ['ken', 'kenny'],
  'lawrence': ['larry', 'lars', 'laurie'],
  'leonard': ['leo', 'len', 'lenny'],
  'matthew': ['matt', 'matty'],
  'michael': ['mike', 'mikey', 'mick', 'mickey'],
  'nathan': ['nate', 'nat'],
  'nicholas': ['nick', 'nicky', 'nico'],
  'patrick': ['pat', 'paddy', 'rick'],
  'peter': ['pete', 'petey'],
  'philip': ['phil'],
  'raymond': ['ray'],
  'richard': ['rick', 'dick', 'rich', 'ricky'],
  'robert': ['rob', 'bob', 'bobby', 'robbie', 'bert'],
  'ronald': ['ron', 'ronnie'],
  'samuel': ['sam', 'sammy'],
  'stephen': ['steve', 'steven', 'steph'],
  'theodore': ['ted', 'teddy', 'theo'],
  'thomas': ['tom', 'tommy', 'thom'],
  'timothy': ['tim', 'timmy'],
  'walter': ['walt', 'wally'],
  'william': ['will', 'bill', 'billy', 'willy', 'liam'],
  'abigail': ['abby', 'gail'],
  'alexandra': ['alex', 'lexi', 'sandra', 'sandy'],
  'amanda': ['mandy', 'manda'],
  'barbara': ['barb', 'babs', 'barbie'],
  'catherine': ['cathy', 'cat', 'cate', 'kate', 'katie'],
  'christina': ['chris', 'tina', 'christie'],
  'deborah': ['deb', 'debbie', 'debby'],
  'dorothy': ['dot', 'dottie'],
  'elizabeth': ['liz', 'beth', 'betty', 'eliza', 'libby', 'lisa'],
  'jennifer': ['jen', 'jenny'],
  'jessica': ['jess', 'jessie'],
  'katherine': ['kate', 'katie', 'kathy', 'kat'],
  'kimberly': ['kim', 'kimmy'],
  'margaret': ['maggie', 'meg', 'peggy', 'marge'],
  'michelle': ['shelly', 'mich'],
  'nancy': ['nan'],
  'patricia': ['pat', 'patty', 'trish', 'patsy'],
  'rebecca': ['becca', 'becky'],
  'samantha': ['sam', 'sammy'],
  'stephanie': ['steph', 'stevie'],
  'susan': ['sue', 'susie', 'suzy'],
  'victoria': ['vicky', 'vic', 'tori']
};

function areNamesRelated(name1, name2) {
  if (!name1 || !name2) return false;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return true;

  for (const [fullName, nicknames] of Object.entries(NICKNAME_MAP)) {
    if (n1 === fullName && nicknames.includes(n2)) return true;
    if (n2 === fullName && nicknames.includes(n1)) return true;
    if (nicknames.includes(n1) && nicknames.includes(n2)) return true;
  }

  return false;
}

class DedupeEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || 75;
    this.weights = {
      firstName: options.weights?.firstName || 0.3,
      lastName: options.weights?.lastName || 0.25,
      email: options.weights?.email || 0.25,
      company: options.weights?.company || 0.2
    };
  }

  compareRecords(record1, record2) {
    const scores = {
      firstName: 0,
      lastName: 0,
      email: 0,
      company: 0,
      overall: 0
    };

    if (record1.email && record2.email) {
      if (record1.email.toLowerCase() === record2.email.toLowerCase()) {
        return {
          match: true,
          confidence: 100,
          reason: 'Exact email match',
          scores
        };
      }

      scores.email = fuzz.partial_ratio(
        record1.email.toLowerCase(),
        record2.email.toLowerCase()
      );

      const domain1 = record1.email.split('@')[1];
      const domain2 = record2.email.split('@')[1];
      if (domain1 && domain2 && domain1 === domain2) {
        scores.email = Math.max(scores.email, 50);
      }
    }

    if (record1.firstName && record2.firstName) {
      if (areNamesRelated(record1.firstName, record2.firstName)) {
        scores.firstName = 95;
      } else {
        scores.firstName = fuzz.ratio(
          record1.firstName.toLowerCase(),
          record2.firstName.toLowerCase()
        );
      }
    }

    if (record1.lastName && record2.lastName) {
      scores.lastName = fuzz.ratio(
        record1.lastName.toLowerCase(),
        record2.lastName.toLowerCase()
      );
    }

    if (record1.company && record2.company) {
      const norm1 = this.normalizeCompany(record1.company);
      const norm2 = this.normalizeCompany(record2.company);
      scores.company = fuzz.token_sort_ratio(norm1, norm2);
    }

    scores.overall =
      scores.firstName * this.weights.firstName +
      scores.lastName * this.weights.lastName +
      scores.email * this.weights.email +
      scores.company * this.weights.company;

    let reason = this.generateReason(scores, record1, record2);

    return {
      match: scores.overall >= this.threshold,
      confidence: Math.round(scores.overall),
      reason,
      scores
    };
  }

  normalizeCompany(company) {
    return company
      .toLowerCase()
      .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co)\b/gi, '')
      .replace(/[.,]/g, '')
      .trim();
  }

  generateReason(scores, record1, record2) {
    const reasons = [];

    if (scores.firstName >= 95) {
      if (areNamesRelated(record1.firstName, record2.firstName)) {
        reasons.push(`"${record1.firstName}" and "${record2.firstName}" are related names`);
      } else {
        reasons.push('First names match');
      }
    } else if (scores.firstName >= 80) {
      reasons.push('First names are very similar');
    }

    if (scores.lastName >= 95) {
      reasons.push('Last names match');
    } else if (scores.lastName >= 80) {
      reasons.push('Last names are similar');
    }

    if (scores.company >= 90) {
      reasons.push('Same company');
    } else if (scores.company >= 75) {
      reasons.push('Similar company names');
    }

    if (scores.email >= 75) {
      reasons.push('Similar email addresses');
    } else if (scores.email >= 50) {
      reasons.push('Same email domain');
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : 'Potential match based on overall similarity';
  }

  findDuplicates(records) {
    const duplicates = [];
    const processedPairs = new Set();

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const pairKey = `${i}-${j}`;
        if (processedPairs.has(pairKey)) continue;

        const result = this.compareRecords(records[i], records[j]);

        if (result.match) {
          duplicates.push({
            indices: [i, j],
            records: [records[i], records[j]],
            confidence: result.confidence,
            reason: result.reason,
            scores: result.scores
          });
          processedPairs.add(pairKey);
        }
      }
    }

    const clusters = this.clusterDuplicates(duplicates, records.length);

    return {
      duplicates,
      clusters,
      summary: {
        totalRecords: records.length,
        duplicatesFound: duplicates.length,
        clustersFound: clusters.length,
        recordsAffected: this.countAffectedRecords(clusters)
      }
    };
  }

  clusterDuplicates(duplicates, totalRecords) {
    const clusters = [];

    duplicates.forEach(dup => {
      const [idx1, idx2] = dup.indices;

      let cluster = clusters.find(c =>
        c.indices.includes(idx1) || c.indices.includes(idx2)
      );

      if (cluster) {
        if (!cluster.indices.includes(idx1)) cluster.indices.push(idx1);
        if (!cluster.indices.includes(idx2)) cluster.indices.push(idx2);
        cluster.confidence = Math.max(cluster.confidence, dup.confidence);
      } else {
        clusters.push({
          indices: [idx1, idx2],
          confidence: dup.confidence,
          reason: dup.reason
        });
      }
    });

    return clusters;
  }

  countAffectedRecords(clusters) {
    const affected = new Set();
    clusters.forEach(cluster => {
      cluster.indices.forEach(idx => affected.add(idx));
    });
    return affected.size;
  }

  dedupeRecords(records) {
    const results = this.findDuplicates(records);
    const toRemove = new Set();

    results.clusters.forEach(cluster => {
      for (let i = 1; i < cluster.indices.length; i++) {
        toRemove.add(cluster.indices[i]);
      }
    });

    const cleanRecords = records.filter((record, idx) => !toRemove.has(idx));

    return {
      cleanRecords,
      removedCount: toRemove.size,
      ...results
    };
  }
}

// Main edge function handler
module.exports = async function(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get CSV content from request body
    const csvText = await request.text();

    if (!csvText) {
      return new Response(JSON.stringify({ error: 'No CSV data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      return new Response(JSON.stringify({
        error: 'Failed to parse CSV',
        details: parseResult.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deduplicate records
    const engine = new DedupeEngine({ threshold: 75 });
    const dedupeResults = engine.dedupeRecords(parseResult.data);

    return new Response(JSON.stringify({
      success: true,
      ...dedupeResults
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dedupe error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
