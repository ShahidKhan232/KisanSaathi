interface UserProfile {
  landSize: string;
  crops: string[];
  hasKCC: boolean;
  income: string;
  location?: string;
  previousApplications?: Array<{
    schemeId: string;
    status: 'approved' | 'rejected' | 'pending';
    appliedDate: string;
  }>;
}

interface SchemeEligibility {
  landSizeRange: { min: number; max: number };
  crops?: string[];
  kccRequired: boolean;
  incomeRange: { min: number; max: number };
  locations?: string[];
}

interface SchemeMetrics {
  approvalRate: number;
  avgProcessingDays: number;
  beneficiariesCount: number;
  popularityScore: number;
}

export interface SchemeRecommendation {
  schemeId: string;
  matchScore: number;
  reasonCodes: string[];
  metrics: SchemeMetrics;
}

export class SchemeRecommendationService {
  // Calculate match score based on user profile and scheme eligibility
  private calculateBaseMatchScore(profile: UserProfile, eligibility: SchemeEligibility): number {
    let score = 0;
    let criteriaCount = 0;

    // Land size match (weighted higher)
    if (eligibility.landSizeRange) {
      criteriaCount += 2; // Higher weight
      const userLandSize = parseFloat(profile.landSize.split('-')[0]);
      if (userLandSize >= eligibility.landSizeRange.min && userLandSize <= eligibility.landSizeRange.max) {
        score += 2; // Double points for land size match
      } else if (Math.abs(userLandSize - eligibility.landSizeRange.max) <= 1) {
        score += 1; // Partial credit for close match
      }
    }

    // Crops match (important for targeted schemes)
    if (eligibility.crops && eligibility.crops.length > 0) {
      criteriaCount += 2; // Higher weight for crop-specific schemes
      const matchingCrops = profile.crops.filter(crop => 
        eligibility.crops?.some(schemeCrop => 
          crop.toLowerCase().includes(schemeCrop.toLowerCase()) ||
          schemeCrop.toLowerCase().includes(crop.toLowerCase())
        )
      );
      if (matchingCrops.length > 0) {
        score += 2 * (matchingCrops.length / Math.max(profile.crops.length, eligibility.crops.length));
      }
    }

    // KCC requirement match
    if (eligibility.kccRequired !== undefined) {
      criteriaCount++;
      if (eligibility.kccRequired === profile.hasKCC) {
        score++;
      }
    }

    // Income range match
    if (eligibility.incomeRange) {
      criteriaCount++;
      const userIncome = profile.income === 'below-2.5lakh' ? 200000 : 
                        profile.income === '2.5-5lakh' ? 375000 :
                        profile.income === '5-10lakh' ? 750000 : 1000000;
      if (userIncome >= eligibility.incomeRange.min && userIncome <= eligibility.incomeRange.max) {
        score++;
      } else if (userIncome <= eligibility.incomeRange.max * 1.2) {
        score += 0.5; // Partial credit for close income match
      }
    }

    // Location match
    if (eligibility.locations && profile.location) {
      criteriaCount++;
      if (eligibility.locations.includes(profile.location) || eligibility.locations.includes('All States')) {
        score++;
      }
    }

    // Previous applications penalty/bonus
    if (profile.previousApplications) {
      const schemeId = eligibility.landSizeRange?.toString() || 'unknown';
      const previousApp = profile.previousApplications.find(app => app.schemeId === schemeId);
      if (previousApp) {
        if (previousApp.status === 'approved') {
          score *= 0.3; // Significant penalty for already approved schemes
        } else if (previousApp.status === 'rejected') {
          score *= 0.7; // Moderate penalty for rejected applications
        } else if (previousApp.status === 'pending') {
          score *= 0.8; // Small penalty for pending applications
        }
      }
    }

    return criteriaCount > 0 ? (score / criteriaCount) * 100 : 0;
  }

  // Adjust match score based on historical performance and current metrics
  private adjustMatchScore(
    baseScore: number, 
    metrics: SchemeMetrics,
    previousApplications?: Array<{ schemeId: string; status: string; }>
  ): number {
    let adjustedScore = baseScore;

    // Adjust based on approval rate
    adjustedScore *= (0.7 + (0.3 * metrics.approvalRate));

    // Adjust based on popularity
    adjustedScore *= (0.8 + (0.2 * Math.min(metrics.popularityScore / 100, 1)));

    // Adjust based on user's previous application history
    if (previousApplications?.length) {
      const successRate = previousApplications.filter(app => app.status === 'approved').length / previousApplications.length;
      adjustedScore *= (0.8 + (0.2 * successRate));
    }

    return Math.round(Math.min(adjustedScore, 100));
  }

  // Generate reason codes for match score
  private generateReasonCodes(
    profile: UserProfile, 
    eligibility: SchemeEligibility,
    metrics: SchemeMetrics
  ): string[] {
    const reasons: string[] = [];

    // Land size compatibility
    const userLandSize = parseFloat(profile.landSize.split('-')[0]);
    if (eligibility.landSizeRange && userLandSize >= eligibility.landSizeRange.min && userLandSize <= eligibility.landSizeRange.max) {
      reasons.push('LAND_SIZE_MATCH');
    }

    // Crop match
    if (eligibility.crops && eligibility.crops.length > 0) {
      const matchingCrops = profile.crops.filter(crop => 
        eligibility.crops?.some(schemeCrop => 
          crop.toLowerCase().includes(schemeCrop.toLowerCase()) ||
          schemeCrop.toLowerCase().includes(crop.toLowerCase())
        )
      );
      if (matchingCrops.length > 0) {
        reasons.push('CROP_MATCH');
      }
    }

    // KCC status
    if (eligibility.kccRequired === true && profile.hasKCC) {
      reasons.push('KCC_AVAILABLE');
    } else if (eligibility.kccRequired === false && !profile.hasKCC) {
      reasons.push('NO_KCC_REQUIRED');
    }

    // Income eligibility
    if (eligibility.incomeRange) {
      const userIncome = profile.income === 'below-2.5lakh' ? 200000 : 
                        profile.income === '2.5-5lakh' ? 375000 :
                        profile.income === '5-10lakh' ? 750000 : 1000000;
      if (userIncome >= eligibility.incomeRange.min && userIncome <= eligibility.incomeRange.max) {
        reasons.push('INCOME_ELIGIBLE');
      }
    }

    // High success metrics
    if (metrics.approvalRate > 0.8) {
      reasons.push('HIGH_APPROVAL_RATE');
    } else if (metrics.approvalRate > 0.65) {
      reasons.push('GOOD_APPROVAL_RATE');
    }

    // Processing time
    if (metrics.avgProcessingDays <= 15) {
      reasons.push('QUICK_PROCESSING');
    } else if (metrics.avgProcessingDays <= 30) {
      reasons.push('MODERATE_PROCESSING');
    }

    // Popular scheme
    if (metrics.popularityScore > 85) {
      reasons.push('HIGHLY_POPULAR');
    } else if (metrics.popularityScore > 70) {
      reasons.push('POPULAR_SCHEME');
    }

    // Large beneficiary base
    if (metrics.beneficiariesCount > 5000000) {
      reasons.push('LARGE_BENEFICIARY_BASE');
    } else if (metrics.beneficiariesCount > 1000000) {
      reasons.push('PROVEN_TRACK_RECORD');
    }

    return reasons;
  }

  // Get recommendations for a user
  public async getRecommendations(
    profile: UserProfile,
    schemes: Array<{ id: string; eligibility: SchemeEligibility; metrics: SchemeMetrics; }>
  ): Promise<SchemeRecommendation[]> {
    return schemes.map(scheme => {
      const baseScore = this.calculateBaseMatchScore(profile, scheme.eligibility);
      const adjustedScore = this.adjustMatchScore(baseScore, scheme.metrics, profile.previousApplications);
      const reasonCodes = this.generateReasonCodes(profile, scheme.eligibility, scheme.metrics);

      return {
        schemeId: scheme.id,
        matchScore: adjustedScore,
        reasonCodes,
        metrics: scheme.metrics
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}