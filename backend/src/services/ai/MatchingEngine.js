import ProviderProfile from '../../models/ProviderProfile.js';
import { calculateDistanceInKm } from '../../utils/geo.js';

/**
 * Multi-Factor Provider Ranking Engine
 * Rankings use saved provider skills, service area, review aggregates, and emergency availability.
 */
export class MatchingEngine {
  /**
   * Rank suitable verified providers for a given service request
   * @param {Object} serviceRequest 
   * @returns {Promise<Array<{ provider: Object, matchScore: number, scoreBreakdown: Object }>>}
   */
  async rankProvidersForRequest(serviceRequest) {
    if (!serviceRequest) return [];

    // Query active & verified provider profiles
    const profiles = await ProviderProfile.find({ verificationStatus: 'Verified' })
      .populate('user', 'name email phone avatar status role')
      .populate('categories', 'name');

    const reqSkills = serviceRequest.aiAnalysis?.detectedSkills || [];
    const reqCategory = serviceRequest.category;
    const reqCoords = serviceRequest.location?.coordinates?.coordinates;
    if (!Array.isArray(reqCoords) || reqCoords.length !== 2 || !reqCoords.every(Number.isFinite)) return [];
    const [reqLng, reqLat] = reqCoords;

    const rankedResults = [];

    for (const profile of profiles) {
      // Ineligible check
      if (!profile.user || profile.user.status !== 'Active') {
        continue;
      }

      // 1. Skill Match Score (Weight: 0.35)
      let skillScore = 0;
      const providerSkillsLower = (profile.skills || []).map(s => s.toLowerCase());
      const categoryMatch = (profile.categories || []).some(c => c._id.toString() === reqCategory?.toString());

      if (reqSkills.length > 0) {
        const matchedSkillsCount = reqSkills.filter(s => providerSkillsLower.includes(s.toLowerCase())).length;
        skillScore = matchedSkillsCount / reqSkills.length;
      } else if (categoryMatch) {
        skillScore = 1;
      }
      skillScore = Math.min(1.0, skillScore);
      if (!categoryMatch && skillScore === 0) continue;

      // 2. Proximity Score from the closest configured service area.
      let minDistance = Infinity;
      let proximityScore = 0;

      if (profile.serviceAreas && profile.serviceAreas.length > 0) {
        for (const area of profile.serviceAreas) {
          const coords = area.center?.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite) || !area.radiusInKm) continue;
          const [pLng, pLat] = coords;
          const dist = calculateDistanceInKm(reqLat, reqLng, pLat, pLng);
          const areaScore = Math.max(0, 1 - dist / area.radiusInKm);
          if (areaScore > proximityScore) {
            minDistance = dist;
            proximityScore = areaScore;
          }
        }
      }
      if (!Number.isFinite(minDistance) || proximityScore <= 0) continue;

      // 3. Rating Score (Weight: 0.20)
      const hasReviews = (profile.rating?.count || 0) > 0;
      const ratingScore = hasReviews ? Math.max(0, Math.min(1, (profile.rating.average || 0) / 5)) : null;
      const emergencyRequest = serviceRequest.urgency === 'Emergency';
      const factors = [
        { score: skillScore, weight: 0.5 },
        { score: proximityScore, weight: 0.3 },
        ...(hasReviews ? [{ score: ratingScore, weight: 0.15 }] : []),
        ...(emergencyRequest ? [{ score: profile.isAvailableForEmergency ? 1 : 0, weight: 0.05 }] : [])
      ];
      const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
      const matchScore = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight;

      const matchScorePercentage = Math.round(matchScore * 100);

      rankedResults.push({
        profileId: profile._id,
        provider: profile.user,
        businessName: profile.businessName || profile.user.name,
        hourlyRate: profile.hourlyRate,
        skills: profile.skills,
        rating: profile.rating,
        distanceInKm: Number(minDistance.toFixed(1)),
        matchScore: matchScorePercentage,
        scoreBreakdown: {
          skillMatch: Math.round(skillScore * 100),
          proximityMatch: Math.round(proximityScore * 100),
          ...(hasReviews ? { ratingMatch: Math.round(ratingScore * 100) } : {}),
          ...(emergencyRequest ? { emergencyAvailability: profile.isAvailableForEmergency } : {})
        }
      });
    }

    // Sort descending by match score
    return rankedResults.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export default new MatchingEngine();
