/*
 * Copyright 2025 coze-dev Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface SimulationInput {
  productIdea: string;
  productDescription: string;
  targetCustomers: CustomerSegment[];
  pricingModels: PricingModel[];
  onboardingFlow: string;
  competitors: Competitor[];
  existingAnalytics: string;
  supportTickets: string;
  landingPageCopy: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  techSavviness: 'low' | 'medium' | 'high';
  budgetSensitivity: 'low' | 'medium' | 'high';
  painPoints: string[];
}

export interface PricingModel {
  id: string;
  name: string;
  type: 'freemium' | 'subscription' | 'usage-based' | 'one-time' | 'tiered';
  price: number;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  features: string[];
}

export interface Competitor {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  priceRange: string;
  marketShare: 'dominant' | 'significant' | 'moderate' | 'niche';
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  input: SimulationInput;
  adoption: AdoptionPrediction;
  objections: SegmentObjection[];
  churnRisks: ChurnRisk[];
  featureGaps: FeatureGap[];
  pricingSensitivity: PricingSensitivity[];
  supportBurden: SupportBurden;
  abuseCases: AbuseCase[];
  mvpRecommendation: MVPRecommendation;
  overallScore: number;
  confidence: number;
}

export interface AdoptionPrediction {
  totalPredictedUsers: number;
  timeToProductMarketFit: string;
  adoptionBySegment: SegmentAdoption[];
  monthlyGrowthRate: number;
  viralCoefficient: number;
}

export interface SegmentAdoption {
  segmentName: string;
  adoptionRate: number;
  timeToFirstValue: string;
  conversionRate: number;
  lifetimeValue: number;
  acquisitionCost: number;
}

export interface SegmentObjection {
  segmentName: string;
  objections: Objection[];
}

export interface Objection {
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'price' | 'features' | 'trust' | 'competition' | 'complexity' | 'timing';
  mitigation: string;
}

export interface ChurnRisk {
  factor: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedSegments: string[];
  mitigation: string;
  timeframe: string;
}

export interface FeatureGap {
  feature: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  requestedBySegments: string[];
  estimatedEffort: string;
  competitorHasIt: boolean;
  impactOnAdoption: number;
}

export interface PricingSensitivity {
  modelName: string;
  optimalPrice: number;
  elasticity: number;
  willingness: WillingnessRange;
  revenueProjection: number;
  conversionImpact: number;
}

export interface WillingnessRange {
  min: number;
  max: number;
  sweet: number;
}

export interface SupportBurden {
  estimatedTicketsPerMonth: number;
  topIssueCategories: SupportCategory[];
  estimatedCostPerMonth: number;
  selfServiceOpportunities: string[];
  peakLoadTimes: string[];
}

export interface SupportCategory {
  category: string;
  percentage: number;
  avgResolutionTime: string;
  automatable: boolean;
}

export interface AbuseCase {
  scenario: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  prevention: string;
  detectionMethod: string;
}

export interface MVPRecommendation {
  scope: string;
  coreFeatures: string[];
  deferredFeatures: string[];
  technicalArchitecture: string;
  estimatedTimeline: string;
  teamSize: string;
  initialBacklog: BacklogItem[];
  goToMarketPlan: string;
  landingPageSuggestion: string;
}

export interface BacklogItem {
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  description: string;
}

export type SimulationStatus = 'idle' | 'configuring' | 'running' | 'complete' | 'error';
