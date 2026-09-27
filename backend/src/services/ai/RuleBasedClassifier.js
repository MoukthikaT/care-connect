import IAIClassifier from './IAIClassifier.js';
import ServiceCategory from '../../models/ServiceCategory.js';

export class RuleBasedClassifier extends IAIClassifier {
  /**
   * Classify free-text customer problem description using deterministic NLP keyword matching
   * @param {string} textDescription 
   * @returns {Promise<{ suggestedCategory: string, categoryId: string|null, detectedSkills: string[], urgency: string, complexityScore: number, aiTags: string[], confidenceScore: number }>}
   */
  async classifyRequest(textDescription = '') {
    const rawText = (textDescription || '').toLowerCase();
    const tokens = rawText.match(/\b[a-z]{3,}\b/g) || [];

    // Fetch active categories & subcategories from DB
    const categories = await ServiceCategory.find({ isActive: true });

    let bestCategory = null;
    let maxMatchCount = 0;
    const detectedSkills = new Set();
    const aiTags = new Set();

    // Emergency & Urgency Keywords Dictionary
    const emergencyKeywords = ['flooding', 'flood', 'sparking', 'fire', 'gas', 'burst', 'overflow', 'pipe burst', 'hazard'];
    const highUrgencyKeywords = ['leak', 'leaking', 'broken', 'urgent', 'asap', 'smoke', 'no power', 'no heating', 'no ac', 'clogged'];

    let urgency = 'Normal';
    if (emergencyKeywords.some(kw => rawText.includes(kw))) {
      urgency = 'Emergency';
      aiTags.add('Emergency-Triage');
    } else if (highUrgencyKeywords.some(kw => rawText.includes(kw))) {
      urgency = 'High';
      aiTags.add('High-Priority');
    }

    // Domain Keyword Dictionaries for robust classification matching
    const domainKeywordMap = {
      'Plumbing Services': ['pipe', 'leak', 'leaking', 'water', 'sink', 'faucet', 'drain', 'clog', 'clogged', 'toilet', 'shower', 'sewer', 'spigot', 'plumb', 'plumbing'],
      'Electrical & Wiring': ['wire', 'wiring', 'light', 'lighting', 'outlet', 'switch', 'breaker', 'panel', 'spark', 'sparking', 'socket', 'electric', 'electrical', 'short circuit', 'power'],
      'Home Cleaning': ['clean', 'cleaning', 'dust', 'carpet', 'stain', 'sanitize', 'mop', 'window', 'deep clean', 'vacuum', 'dusting'],
      'HVAC & Climate': ['ac', 'air conditioning', 'heat', 'heating', 'furnace', 'cool', 'cooling', 'thermostat', 'hvac', 'duct', 'vent', 'refrigerant'],
      'Handyman & Carpentry': ['furniture', 'assembly', 'door', 'lock', 'hinge', 'cabinet', 'shelf', 'mount', 'mounting', 'carpentry', 'wood', 'table', 'chair', 'repair']
    };

    // Match tokens against categories and subcategories
    for (const cat of categories) {
      let currentMatchCount = 0;
      const catNameLower = cat.name.toLowerCase();

      // Check category name
      if (rawText.includes(catNameLower) || tokens.some(t => catNameLower.includes(t))) {
        currentMatchCount += 3;
        aiTags.add(cat.name);
      }

      // Check domain keywords dictionary for category
      for (const [domainName, kwList] of Object.entries(domainKeywordMap)) {
        const domainWords = domainName.toLowerCase().split(/\s+/);
        const isDomainMatch = domainWords.some(w => w.length > 3 && (catNameLower.includes(w) || w.includes(catNameLower))) ||
          (cat.description && cat.description.toLowerCase().includes(domainName.toLowerCase()));

        if (isDomainMatch) {
          kwList.forEach(kw => {
            if (rawText.includes(kw)) {
              currentMatchCount += 2;
              detectedSkills.add(kw.charAt(0).toUpperCase() + kw.slice(1) + ' Repair');
            }
          });
        }
      }

      for (const sub of cat.subcategories || []) {
        const subNameLower = sub.name.toLowerCase();
        if (rawText.includes(subNameLower)) {
          currentMatchCount += 2;
          detectedSkills.add(sub.name);
        }

        for (const skill of sub.requiredSkills || []) {
          const skillLower = skill.toLowerCase();
          if (rawText.includes(skillLower) || tokens.some(t => skillLower === t)) {
            currentMatchCount += 1;
            detectedSkills.add(skill);
          }
        }
      }

      if (currentMatchCount > maxMatchCount) {
        maxMatchCount = currentMatchCount;
        bestCategory = cat;
      }
    }

    // Determine Confidence Score & Complexity
    let confidenceScore = 0.35; // Default low confidence for ambiguous text
    let suggestedCategoryName = 'General Home Service';
    let categoryId = null;

    if (bestCategory && maxMatchCount >= 2) {
      confidenceScore = Math.min(0.95, 0.65 + (maxMatchCount * 0.08));
      suggestedCategoryName = bestCategory.name;
      categoryId = bestCategory._id;
      aiTags.add('Auto-Categorized');
    } else if (bestCategory && maxMatchCount === 1) {
      confidenceScore = 0.55;
      suggestedCategoryName = bestCategory.name;
      categoryId = bestCategory._id;
      aiTags.add('Low-Confidence-Match');
    } else {
      // Best-effort keyword match against domainKeywordMap
      let fallbackMatchedName = null;
      for (const [domainName, kwList] of Object.entries(domainKeywordMap)) {
        if (kwList.some(kw => rawText.includes(kw))) {
          fallbackMatchedName = domainName;
          kwList.forEach(kw => {
            if (rawText.includes(kw)) {
              detectedSkills.add(kw.charAt(0).toUpperCase() + kw.slice(1) + ' Repair');
            }
          });
          break;
        }
      }

      if (fallbackMatchedName) {
        suggestedCategoryName = fallbackMatchedName;
        confidenceScore = 0.85;
        aiTags.add('AI-Domain-Match');

        // Match only a category configured in the database; classification never mutates catalog data.
        let catDoc = categories.find(c => 
          c.name.toLowerCase().includes(fallbackMatchedName.toLowerCase()) ||
          fallbackMatchedName.toLowerCase().includes(c.name.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(fallbackMatchedName.toLowerCase()))
        );
        if (catDoc) {
          categoryId = catDoc._id;
          suggestedCategoryName = catDoc.name;
        }
      } else if (categories.length > 0) {
        suggestedCategoryName = categories[0].name;
        categoryId = categories[0]._id;
        aiTags.add('Needs-Manual-Review');
      } else {
        aiTags.add('Needs-Manual-Review');
      }
    }

    // Calculate Complexity Score (1.0 to 5.0)
    const wordCount = tokens.length;
    let complexityScore = 1.5;
    if (wordCount > 30) complexityScore += 1.0;
    if (detectedSkills.size >= 3) complexityScore += 1.5;
    if (urgency === 'Emergency') complexityScore += 1.0;
    complexityScore = Math.min(5.0, Number(complexityScore.toFixed(1)));

    return {
      suggestedCategory: suggestedCategoryName,
      categoryId,
      detectedSkills: Array.from(detectedSkills),
      urgency,
      complexityScore,
      aiTags: Array.from(aiTags),
      confidenceScore: Number(confidenceScore.toFixed(2))
    };
  }
}

export default new RuleBasedClassifier();
