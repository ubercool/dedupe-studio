const fuzz = require('fuzzball');
const { areNamesRelated } = require('./nicknames');

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

module.exports = DedupeEngine;
