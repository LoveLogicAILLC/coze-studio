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

import type {
  SimulationInput,
  SimulationResult,
  AdoptionPrediction,
  SegmentObjection,
  ChurnRisk,
  FeatureGap,
  PricingSensitivity,
  SupportBurden,
  AbuseCase,
  MVPRecommendation,
  CustomerSegment,
  PricingModel,
  Competitor,
} from '../types';

function generateId(): string {
  return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function computeCompetitiveIntensity(competitors: Competitor[]): number {
  if (competitors.length === 0) return 0.1;
  const dominantCount = competitors.filter(
    c => c.marketShare === 'dominant',
  ).length;
  const significantCount = competitors.filter(
    c => c.marketShare === 'significant',
  ).length;
  return clamp(
    0.2 + dominantCount * 0.25 + significantCount * 0.15 + competitors.length * 0.05,
    0.1,
    0.95,
  );
}

function computeSegmentScore(segment: CustomerSegment): number {
  const sizeMultiplier =
    segment.size === 'enterprise'
      ? 1.2
      : segment.size === 'large'
        ? 1.0
        : segment.size === 'medium'
          ? 0.8
          : 0.6;
  const techMultiplier =
    segment.techSavviness === 'high'
      ? 1.1
      : segment.techSavviness === 'medium'
        ? 1.0
        : 0.8;
  const budgetMultiplier =
    segment.budgetSensitivity === 'low'
      ? 1.2
      : segment.budgetSensitivity === 'medium'
        ? 1.0
        : 0.7;
  return sizeMultiplier * techMultiplier * budgetMultiplier;
}

function simulateAdoption(
  input: SimulationInput,
  competitiveIntensity: number,
): AdoptionPrediction {
  const segments = input.targetCustomers;
  const hasFreemium = input.pricingModels.some(p => p.type === 'freemium');
  const avgPrice =
    input.pricingModels.reduce((sum, p) => sum + p.price, 0) /
    Math.max(input.pricingModels.length, 1);

  const adoptionBySegment = segments.map(segment => {
    const segScore = computeSegmentScore(segment);
    const priceAdjust = avgPrice > 100 ? 0.7 : avgPrice > 50 ? 0.85 : 1.0;
    const freemiumBoost = hasFreemium ? 1.3 : 1.0;

    const adoptionRate = clamp(
      segScore * priceAdjust * freemiumBoost * (1 - competitiveIntensity * 0.5) * 0.4,
      0.02,
      0.65,
    );
    const conversionRate = clamp(
      adoptionRate * (segment.budgetSensitivity === 'low' ? 1.5 : 0.8),
      0.01,
      0.45,
    );

    const ltv = avgPrice * 12 * conversionRate * segScore;
    const cac = avgPrice * (competitiveIntensity > 0.5 ? 8 : 4);

    return {
      segmentName: segment.name,
      adoptionRate: Math.round(adoptionRate * 100) / 100,
      timeToFirstValue:
        segment.techSavviness === 'high'
          ? '1-2 days'
          : segment.techSavviness === 'medium'
            ? '3-5 days'
            : '1-2 weeks',
      conversionRate: Math.round(conversionRate * 100) / 100,
      lifetimeValue: Math.round(ltv),
      acquisitionCost: Math.round(cac),
    };
  });

  const avgAdoption =
    adoptionBySegment.reduce((sum, s) => sum + s.adoptionRate, 0) /
    Math.max(adoptionBySegment.length, 1);

  return {
    totalPredictedUsers: Math.round(
      segments.length * 1000 * avgAdoption * (hasFreemium ? 3 : 1),
    ),
    timeToProductMarketFit:
      avgAdoption > 0.3
        ? '3-6 months'
        : avgAdoption > 0.15
          ? '6-12 months'
          : '12-18 months',
    adoptionBySegment,
    monthlyGrowthRate: Math.round(avgAdoption * 15 * 100) / 100,
    viralCoefficient: Math.round(clamp(avgAdoption * 2.5, 0.1, 1.8) * 100) / 100,
  };
}

function simulateObjections(
  input: SimulationInput,
  competitiveIntensity: number,
): SegmentObjection[] {
  return input.targetCustomers.map(segment => {
    const objections: SegmentObjection['objections'] = [];

    if (segment.budgetSensitivity === 'high') {
      objections.push({
        text: `"The pricing feels high for what we get compared to ${input.competitors[0]?.name || 'existing tools'}."`,
        severity: 'high',
        category: 'price',
        mitigation:
          'Introduce a starter tier with core features at 60% lower price point.',
      });
    }

    if (segment.techSavviness === 'low') {
      objections.push({
        text: '"The setup process looks too technical for our team."',
        severity: 'medium',
        category: 'complexity',
        mitigation:
          'Add a guided onboarding wizard with templates and white-glove setup for first 30 days.',
      });
    }

    if (competitiveIntensity > 0.5) {
      objections.push({
        text: `"We already use ${input.competitors[0]?.name || 'a competitor'} and switching costs are high."`,
        severity: 'high',
        category: 'competition',
        mitigation:
          'Build migration tools and offer data import. Emphasize unique differentiators in onboarding.',
      });
    }

    if (segment.painPoints.length > 0) {
      objections.push({
        text: `"Does this actually solve ${segment.painPoints[0]}? We've been burned before."`,
        severity: 'medium',
        category: 'trust',
        mitigation:
          'Offer a free proof-of-concept period with dedicated support. Publish case studies from early adopters.',
      });
    }

    objections.push({
      text: '"We need to see ROI within the first quarter or leadership will pull the plug."',
      severity: 'medium',
      category: 'timing',
      mitigation:
        'Build an ROI calculator into the product. Provide weekly value reports during the trial period.',
    });

    return { segmentName: segment.name, objections };
  });
}

function simulateChurnRisks(
  input: SimulationInput,
  competitiveIntensity: number,
): ChurnRisk[] {
  const risks: ChurnRisk[] = [
    {
      factor: 'Onboarding drop-off',
      probability: input.onboardingFlow.length < 50 ? 0.45 : 0.2,
      impact: 'high',
      affectedSegments: input.targetCustomers
        .filter(s => s.techSavviness === 'low')
        .map(s => s.name),
      mitigation:
        'Implement progressive onboarding with milestone celebrations and contextual help.',
      timeframe: 'First 7 days',
    },
    {
      factor: 'Feature insufficiency',
      probability: clamp(competitiveIntensity * 0.6, 0.1, 0.7),
      impact: 'high',
      affectedSegments: input.targetCustomers
        .filter(s => s.size === 'enterprise' || s.size === 'large')
        .map(s => s.name),
      mitigation:
        'Establish a public roadmap and weekly feature releases. Create a feature request voting system.',
      timeframe: 'Month 2-4',
    },
    {
      factor: 'Price-to-value misalignment',
      probability: input.pricingModels.some(p => p.price > 100) ? 0.35 : 0.15,
      impact: 'critical',
      affectedSegments: input.targetCustomers
        .filter(s => s.budgetSensitivity === 'high')
        .map(s => s.name),
      mitigation:
        'Introduce usage-based pricing tiers. Offer annual discount for commitment.',
      timeframe: 'Month 3-6',
    },
    {
      factor: 'Competitor response',
      probability: competitiveIntensity > 0.5 ? 0.55 : 0.2,
      impact: 'medium',
      affectedSegments: input.targetCustomers.map(s => s.name),
      mitigation:
        'Build deep integrations and high switching costs. Focus on unique AI capabilities that are hard to replicate.',
      timeframe: 'Month 6-12',
    },
    {
      factor: 'Support responsiveness',
      probability: 0.25,
      impact: 'medium',
      affectedSegments: input.targetCustomers
        .filter(s => s.size === 'enterprise')
        .map(s => s.name),
      mitigation:
        'Implement SLA-backed support tiers. Build comprehensive self-service knowledge base.',
      timeframe: 'Ongoing',
    },
  ];

  return risks.filter(r => r.affectedSegments.length > 0 || r.probability > 0.2);
}

function simulateFeatureGaps(
  input: SimulationInput,
  competitors: Competitor[],
): FeatureGap[] {
  const gaps: FeatureGap[] = [];
  const allCompetitorStrengths = competitors.flatMap(c => c.strengths);

  const commonGaps = [
    {
      feature: 'API & SDK access',
      priority: 'must-have' as const,
      effort: '2-4 weeks',
    },
    {
      feature: 'Team collaboration & permissions',
      priority: 'must-have' as const,
      effort: '3-5 weeks',
    },
    {
      feature: 'Custom integrations marketplace',
      priority: 'should-have' as const,
      effort: '4-8 weeks',
    },
    {
      feature: 'Advanced analytics dashboard',
      priority: 'should-have' as const,
      effort: '2-3 weeks',
    },
    {
      feature: 'White-label / embedding options',
      priority: 'nice-to-have' as const,
      effort: '4-6 weeks',
    },
    {
      feature: 'SSO & enterprise auth',
      priority: 'must-have' as const,
      effort: '2-3 weeks',
    },
    {
      feature: 'Audit logging & compliance',
      priority: 'should-have' as const,
      effort: '2-4 weeks',
    },
    {
      feature: 'Offline / self-hosted mode',
      priority: 'nice-to-have' as const,
      effort: '6-10 weeks',
    },
  ];

  for (const gap of commonGaps) {
    const competitorHasIt = allCompetitorStrengths.some(s =>
      s.toLowerCase().includes(gap.feature.toLowerCase().split(' ')[0]),
    );
    const requestedBySegments = input.targetCustomers
      .filter(seg => {
        if (gap.priority === 'must-have') return true;
        if (gap.priority === 'should-have')
          return seg.size === 'enterprise' || seg.size === 'large';
        return seg.size === 'enterprise';
      })
      .map(s => s.name);

    if (requestedBySegments.length > 0) {
      gaps.push({
        feature: gap.feature,
        priority: gap.priority,
        requestedBySegments,
        estimatedEffort: gap.effort,
        competitorHasIt,
        impactOnAdoption: gap.priority === 'must-have' ? 0.3 : gap.priority === 'should-have' ? 0.15 : 0.05,
      });
    }
  }

  return gaps;
}

function simulatePricingSensitivity(
  pricingModels: PricingModel[],
  segments: CustomerSegment[],
  competitiveIntensity: number,
): PricingSensitivity[] {
  return pricingModels.map(model => {
    const baseElasticity = model.type === 'freemium' ? -0.3 : model.type === 'usage-based' ? -1.2 : -0.8;
    const competitiveAdjust = competitiveIntensity > 0.5 ? 1.3 : 1.0;
    const elasticity = Math.round(baseElasticity * competitiveAdjust * 100) / 100;

    const avgBudgetSensitivity =
      segments.reduce(
        (sum, s) =>
          sum +
          (s.budgetSensitivity === 'high'
            ? 0.6
            : s.budgetSensitivity === 'medium'
              ? 0.8
              : 1.0),
        0,
      ) / Math.max(segments.length, 1);

    const optimalPrice = Math.round(model.price * avgBudgetSensitivity);
    const conversionImpact = model.type === 'freemium' ? 0.4 : model.type === 'tiered' ? 0.25 : 0.15;

    return {
      modelName: model.name,
      optimalPrice,
      elasticity,
      willingness: {
        min: Math.round(optimalPrice * 0.5),
        max: Math.round(optimalPrice * 1.8),
        sweet: optimalPrice,
      },
      revenueProjection: Math.round(
        optimalPrice * segments.length * 100 * avgBudgetSensitivity,
      ),
      conversionImpact: Math.round(conversionImpact * 100) / 100,
    };
  });
}

function simulateSupportBurden(
  input: SimulationInput,
  adoption: AdoptionPrediction,
): SupportBurden {
  const userCount = adoption.totalPredictedUsers;
  const ticketRate = input.onboardingFlow.length > 100 ? 0.08 : 0.15;
  const estimatedTickets = Math.round(userCount * ticketRate);

  return {
    estimatedTicketsPerMonth: estimatedTickets,
    topIssueCategories: [
      {
        category: 'Account & billing',
        percentage: 25,
        avgResolutionTime: '2 hours',
        automatable: true,
      },
      {
        category: 'Feature questions',
        percentage: 30,
        avgResolutionTime: '4 hours',
        automatable: true,
      },
      {
        category: 'Integration issues',
        percentage: 20,
        avgResolutionTime: '8 hours',
        automatable: false,
      },
      {
        category: 'Bug reports',
        percentage: 15,
        avgResolutionTime: '24 hours',
        automatable: false,
      },
      {
        category: 'Feature requests',
        percentage: 10,
        avgResolutionTime: '1 hour',
        automatable: true,
      },
    ],
    estimatedCostPerMonth: Math.round(estimatedTickets * 15),
    selfServiceOpportunities: [
      'Interactive onboarding tutorials',
      'Searchable knowledge base with video guides',
      'In-app contextual help tooltips',
      'Community forum with power-user moderators',
      'AI-powered chatbot for common questions',
    ],
    peakLoadTimes: [
      'Monday mornings (9-11 AM)',
      'After product updates',
      'End of billing cycles',
      'Start of new quarters',
    ],
  };
}

function simulateAbuseCases(input: SimulationInput): AbuseCase[] {
  const cases: AbuseCase[] = [
    {
      scenario: 'Free tier abuse via multiple accounts',
      likelihood: input.pricingModels.some(p => p.type === 'freemium')
        ? 'high'
        : 'low',
      impact: 'medium',
      prevention:
        'Implement email verification, phone verification for free tier, and usage fingerprinting.',
      detectionMethod:
        'Monitor for shared IP addresses, similar usage patterns, and rapid account creation.',
    },
    {
      scenario: 'API rate abuse and scraping',
      likelihood: 'medium',
      impact: 'high',
      prevention:
        'Implement tiered rate limits, API key rotation, and request signature validation.',
      detectionMethod:
        'Anomaly detection on API call patterns, geographic distribution, and request timing.',
    },
    {
      scenario: 'Content policy violations via AI features',
      likelihood: 'high',
      impact: 'critical',
      prevention:
        'Implement content moderation pipeline, input/output filters, and human review for flagged content.',
      detectionMethod:
        'Real-time content classification, user reporting system, and periodic audits.',
    },
    {
      scenario: 'Credential sharing across organizations',
      likelihood: 'medium',
      impact: 'medium',
      prevention:
        'Enforce concurrent session limits, IP-based alerts, and SSO for enterprise tiers.',
      detectionMethod:
        'Track login geography, concurrent sessions, and unusual access patterns.',
    },
    {
      scenario: 'Data exfiltration attempts',
      likelihood: 'low',
      impact: 'critical',
      prevention:
        'Implement data loss prevention controls, export rate limits, and audit logging.',
      detectionMethod:
        'Monitor bulk export operations, unusual data access patterns, and API download volumes.',
    },
  ];

  return cases;
}

function simulateMVPRecommendation(
  input: SimulationInput,
  adoption: AdoptionPrediction,
  featureGaps: FeatureGap[],
): MVPRecommendation {
  const mustHaveFeatures = featureGaps
    .filter(g => g.priority === 'must-have')
    .map(g => g.feature);

  const coreFeatures = [
    `Core ${input.productIdea} engine`,
    'User authentication and workspace management',
    ...mustHaveFeatures.slice(0, 3),
    'Basic analytics and usage tracking',
    'Email notifications and alerts',
  ];

  const deferredFeatures = [
    ...featureGaps
      .filter(g => g.priority === 'nice-to-have')
      .map(g => g.feature),
    'Advanced customization options',
    'Mobile application',
    'Third-party marketplace',
  ];

  return {
    scope: `Build a focused ${input.productIdea} targeting ${input.targetCustomers[0]?.name || 'early adopters'} with ${coreFeatures.length} core features. ${adoption.timeToProductMarketFit} estimated to product-market fit.`,
    coreFeatures,
    deferredFeatures,
    technicalArchitecture: [
      'Frontend: React + TypeScript SPA with real-time collaboration',
      'Backend: Go microservices with event-driven architecture',
      'Database: PostgreSQL (primary) + Redis (cache) + Elasticsearch (search)',
      'AI Layer: LLM orchestration with streaming, RAG pipeline, vector store',
      'Infrastructure: Kubernetes on cloud with auto-scaling, CDN for static assets',
      'Observability: Structured logging, distributed tracing, real-time alerting',
    ].join('\n'),
    estimatedTimeline:
      adoption.totalPredictedUsers > 5000
        ? '12-16 weeks to launch'
        : '8-12 weeks to launch',
    teamSize:
      input.targetCustomers.length > 3
        ? '5-7 engineers, 1 designer, 1 PM'
        : '3-4 engineers, 1 designer, 1 PM',
    initialBacklog: [
      {
        title: 'User authentication & workspace setup',
        priority: 'P0',
        effort: 'M',
        description:
          'Sign up, login, workspace creation, team invites, role-based access.',
      },
      {
        title: `Core ${input.productIdea} engine`,
        priority: 'P0',
        effort: 'XL',
        description:
          'Primary value-delivery feature with AI integration and real-time processing.',
      },
      {
        title: 'Onboarding flow & guided setup',
        priority: 'P0',
        effort: 'M',
        description:
          'Step-by-step wizard, sample data, interactive tutorials.',
      },
      {
        title: 'Billing & subscription management',
        priority: 'P1',
        effort: 'L',
        description:
          'Stripe integration, plan management, usage tracking, invoicing.',
      },
      {
        title: 'Analytics dashboard',
        priority: 'P1',
        effort: 'M',
        description:
          'Usage metrics, adoption tracking, value realization reports.',
      },
      {
        title: 'API & developer documentation',
        priority: 'P1',
        effort: 'L',
        description:
          'RESTful API, SDK libraries, interactive API explorer, developer portal.',
      },
      {
        title: 'Support system & knowledge base',
        priority: 'P2',
        effort: 'M',
        description:
          'In-app help, ticketing integration, searchable docs, community forum.',
      },
      {
        title: 'Performance optimization & scaling',
        priority: 'P2',
        effort: 'L',
        description:
          'Load testing, database optimization, caching strategy, CDN setup.',
      },
    ],
    goToMarketPlan: [
      '1. Launch private beta with 50-100 hand-picked users from target segment',
      '2. Gather feedback, iterate on core features for 4-6 weeks',
      '3. Launch public beta with waitlist, content marketing, and SEO',
      '4. Partner with 3-5 complementary tools for co-marketing',
      '5. Run targeted ads on channels where target customers gather',
      '6. Publish case studies and ROI reports from beta users',
      '7. Launch Product Hunt and Hacker News for developer mindshare',
      '8. Begin outbound sales for enterprise segment',
    ].join('\n'),
    landingPageSuggestion: [
      `Headline: "${input.productIdea} — ${input.productDescription.slice(0, 80) || 'Built for teams that move fast'}"`,
      '',
      'Hero section: Interactive demo showing the core value prop in action',
      'Social proof: Logos and quotes from beta users',
      'Feature grid: 3-4 key differentiators with icons',
      'Pricing: Clear tiers with feature comparison table',
      'CTA: "Start free trial" (no credit card required)',
      'FAQ: Address top 5 objections identified in simulation',
    ].join('\n'),
  };
}

export class SimulationEngine {
  run(input: SimulationInput): SimulationResult {
    const competitiveIntensity = computeCompetitiveIntensity(input.competitors);
    const adoption = simulateAdoption(input, competitiveIntensity);
    const objections = simulateObjections(input, competitiveIntensity);
    const churnRisks = simulateChurnRisks(input, competitiveIntensity);
    const featureGaps = simulateFeatureGaps(input, input.competitors);
    const pricingSensitivity = simulatePricingSensitivity(
      input.pricingModels,
      input.targetCustomers,
      competitiveIntensity,
    );
    const supportBurden = simulateSupportBurden(input, adoption);
    const abuseCases = simulateAbuseCases(input);
    const mvpRecommendation = simulateMVPRecommendation(
      input,
      adoption,
      featureGaps,
    );

    const overallScore = clamp(
      Math.round(
        (adoption.monthlyGrowthRate * 2 +
          (1 - competitiveIntensity) * 30 +
          adoption.viralCoefficient * 20) /
          3,
      ),
      10,
      95,
    );

    const confidence = clamp(
      Math.round(
        40 +
          input.targetCustomers.length * 5 +
          input.competitors.length * 3 +
          (input.existingAnalytics.length > 20 ? 10 : 0) +
          (input.supportTickets.length > 20 ? 5 : 0),
      ),
      30,
      85,
    );

    return {
      id: generateId(),
      timestamp: Date.now(),
      input,
      adoption,
      objections,
      churnRisks,
      featureGaps,
      pricingSensitivity,
      supportBurden,
      abuseCases,
      mvpRecommendation,
      overallScore,
      confidence,
    };
  }
}
