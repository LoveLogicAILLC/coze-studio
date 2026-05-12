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

import React from 'react';

import type { SimulationResult } from '../types';
import styles from '../styles/simulation.module.css';

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

function getSeverityClass(
  severity: string,
): string {
  switch (severity) {
    case 'critical':
      return styles.badgeCritical;
    case 'high':
      return styles.badgeHigh;
    case 'medium':
      return styles.badgeMedium;
    case 'low':
      return styles.badgeLow;
    default:
      return styles.badgeLow;
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'P0':
      return '#ef4444';
    case 'P1':
      return '#f97316';
    case 'P2':
      return '#eab308';
    case 'P3':
      return '#22c55e';
    default:
      return '#71717a';
  }
}

function AdoptionSection({ result }: { result: SimulationResult }) {
  const { adoption } = result;

  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Adoption Prediction</div>
      {adoption.adoptionBySegment.map(seg => (
        <div key={seg.segmentName} className={styles.adoptionBar}>
          <div className={styles.adoptionBarHeader}>
            <span className={styles.adoptionBarName}>{seg.segmentName}</span>
            <span className={styles.adoptionBarValue}>
              {Math.round(seg.adoptionRate * 100)}% adoption
            </span>
          </div>
          <div className={styles.adoptionBarTrack}>
            <div
              className={styles.adoptionBarFill}
              style={{ width: `${Math.round(seg.adoptionRate * 100)}%` }}
            />
          </div>
          <div className={styles.adoptionMeta}>
            <span className={styles.adoptionMetaItem}>
              Time to value: {seg.timeToFirstValue}
            </span>
            <span className={styles.adoptionMetaItem}>
              Conversion: {Math.round(seg.conversionRate * 100)}%
            </span>
            <span className={styles.adoptionMetaItem}>
              LTV: ${seg.lifetimeValue}
            </span>
            <span className={styles.adoptionMetaItem}>
              CAC: ${seg.acquisitionCost}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectionsSection({ result }: { result: SimulationResult }) {
  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>
        Objections by Customer Segment
      </div>
      {result.objections.map(group => (
        <div key={group.segmentName} className={styles.segmentGroup}>
          <div className={styles.segmentGroupTitle}>{group.segmentName}</div>
          {group.objections.map((obj, i) => (
            <div key={`${group.segmentName}-${i}`} className={styles.objectionCard}>
              <div className={styles.objectionText}>{obj.text}</div>
              <div className={styles.objectionMeta}>
                <span
                  className={`${styles.badge} ${getSeverityClass(obj.severity)}`}
                >
                  {obj.severity}
                </span>
                <span
                  className={`${styles.badge}`}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                  }}
                >
                  {obj.category}
                </span>
              </div>
              <div className={styles.objectionMitigation}>
                {obj.mitigation}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ChurnSection({ result }: { result: SimulationResult }) {
  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Churn Risk Analysis</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Risk Factor</th>
            <th>Probability</th>
            <th>Impact</th>
            <th>Timeframe</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {result.churnRisks.map((risk, i) => (
            <tr key={`churn-${i}`}>
              <td>{risk.factor}</td>
              <td>
                <div className={styles.probBar}>
                  <div className={styles.probBarTrack}>
                    <div
                      className={styles.probBarFill}
                      style={{
                        width: `${Math.round(risk.probability * 100)}%`,
                        background:
                          risk.probability > 0.5
                            ? '#ef4444'
                            : risk.probability > 0.3
                              ? '#f97316'
                              : '#22c55e',
                      }}
                    />
                  </div>
                  <span className={styles.probBarValue}>
                    {Math.round(risk.probability * 100)}%
                  </span>
                </div>
              </td>
              <td>
                <span
                  className={`${styles.badge} ${getSeverityClass(risk.impact)}`}
                >
                  {risk.impact}
                </span>
              </td>
              <td style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {risk.timeframe}
              </td>
              <td style={{ fontSize: '12px', color: '#86efac', maxWidth: 260 }}>
                {risk.mitigation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureGapsSection({ result }: { result: SimulationResult }) {
  const priorityClass = (p: string) => {
    if (p === 'must-have') return styles.badgeMustHave;
    if (p === 'should-have') return styles.badgeShouldHave;
    return styles.badgeNiceToHave;
  };

  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Feature Gap Analysis</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Priority</th>
            <th>Effort</th>
            <th>Competitor Has It</th>
            <th>Adoption Impact</th>
            <th>Requested By</th>
          </tr>
        </thead>
        <tbody>
          {result.featureGaps.map((gap, i) => (
            <tr key={`gap-${i}`}>
              <td>{gap.feature}</td>
              <td>
                <span className={`${styles.badge} ${priorityClass(gap.priority)}`}>
                  {gap.priority}
                </span>
              </td>
              <td style={{ color: '#a1a1aa' }}>{gap.estimatedEffort}</td>
              <td style={{ color: gap.competitorHasIt ? '#fca5a5' : '#86efac' }}>
                {gap.competitorHasIt ? 'Yes' : 'No'}
              </td>
              <td>
                <div className={styles.probBar}>
                  <div className={styles.probBarTrack}>
                    <div
                      className={styles.probBarFill}
                      style={{
                        width: `${Math.round(gap.impactOnAdoption * 100)}%`,
                        background: '#6366f1',
                      }}
                    />
                  </div>
                  <span className={styles.probBarValue}>
                    +{Math.round(gap.impactOnAdoption * 100)}%
                  </span>
                </div>
              </td>
              <td style={{ fontSize: '11px', color: '#a1a1aa' }}>
                {gap.requestedBySegments.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingSection({ result }: { result: SimulationResult }) {
  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Pricing Sensitivity</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(result.pricingSensitivity.length, 3)}, 1fr)`,
          gap: '16px',
        }}
      >
        {result.pricingSensitivity.map((ps, i) => (
          <div
            key={`pricing-${i}`}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#a5b4fc',
                marginBottom: '12px',
              }}
            >
              {ps.modelName || `Tier ${i + 1}`}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: '#71717a' }}>
                Optimal Price
              </div>
              <div
                style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}
              >
                ${ps.optimalPrice}
                <span style={{ fontSize: '12px', color: '#71717a' }}>/mo</span>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: '#71717a' }}>Range: </span>
                <span style={{ color: '#d4d4d8' }}>
                  ${ps.willingness.min}-${ps.willingness.max}
                </span>
              </div>
              <div>
                <span style={{ color: '#71717a' }}>Elasticity: </span>
                <span style={{ color: '#d4d4d8' }}>{ps.elasticity}</span>
              </div>
              <div>
                <span style={{ color: '#71717a' }}>Revenue: </span>
                <span style={{ color: '#22c55e' }}>
                  ${ps.revenueProjection.toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ color: '#71717a' }}>Conv. Impact: </span>
                <span style={{ color: '#d4d4d8' }}>
                  +{Math.round(ps.conversionImpact * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportSection({ result }: { result: SimulationResult }) {
  const { supportBurden } = result;

  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Support Burden Estimate</div>
      <div className={styles.supportGrid}>
        <div className={styles.supportStat}>
          <div className={styles.supportStatValue}>
            {supportBurden.estimatedTicketsPerMonth}
          </div>
          <div className={styles.supportStatLabel}>Tickets / Month</div>
        </div>
        <div className={styles.supportStat}>
          <div className={styles.supportStatValue}>
            ${supportBurden.estimatedCostPerMonth.toLocaleString()}
          </div>
          <div className={styles.supportStatLabel}>Est. Monthly Cost</div>
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>%</th>
              <th>Avg Resolution</th>
              <th>Automatable</th>
            </tr>
          </thead>
          <tbody>
            {supportBurden.topIssueCategories.map((cat, i) => (
              <tr key={`support-${i}`}>
                <td>{cat.category}</td>
                <td>{cat.percentage}%</td>
                <td style={{ color: '#a1a1aa' }}>{cat.avgResolutionTime}</td>
                <td style={{ color: cat.automatable ? '#22c55e' : '#ef4444' }}>
                  {cat.automatable ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#a5b4fc', marginBottom: '8px' }}>
          Self-Service Opportunities
        </div>
        <ul className={styles.mvpList}>
          {supportBurden.selfServiceOpportunities.map((opp, i) => (
            <li key={`opp-${i}`}>{opp}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AbuseSection({ result }: { result: SimulationResult }) {
  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>Likely Abuse Cases</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Likelihood</th>
            <th>Impact</th>
            <th>Prevention</th>
            <th>Detection</th>
          </tr>
        </thead>
        <tbody>
          {result.abuseCases.map((ac, i) => (
            <tr key={`abuse-${i}`}>
              <td>{ac.scenario}</td>
              <td>
                <span
                  className={`${styles.badge} ${getSeverityClass(ac.likelihood)}`}
                >
                  {ac.likelihood}
                </span>
              </td>
              <td>
                <span
                  className={`${styles.badge} ${getSeverityClass(ac.impact)}`}
                >
                  {ac.impact}
                </span>
              </td>
              <td style={{ fontSize: '12px', color: '#d4d4d8', maxWidth: 200 }}>
                {ac.prevention}
              </td>
              <td style={{ fontSize: '12px', color: '#a1a1aa', maxWidth: 200 }}>
                {ac.detectionMethod}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MVPSection({ result }: { result: SimulationResult }) {
  const { mvpRecommendation } = result;

  return (
    <div className={styles.resultSection}>
      <div className={styles.resultSectionTitle}>
        Recommended MVP Scope
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#d4d4d8',
          lineHeight: 1.6,
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '8px',
          borderLeft: '3px solid #6366f1',
        }}
      >
        {mvpRecommendation.scope}
      </div>

      <div className={styles.mvpGrid}>
        <div className={styles.mvpCard}>
          <div className={styles.mvpCardTitle}>Core Features</div>
          <ul className={styles.mvpList}>
            {mvpRecommendation.coreFeatures.map((f, i) => (
              <li key={`core-${i}`}>{f}</li>
            ))}
          </ul>
        </div>
        <div className={styles.mvpCard}>
          <div className={styles.mvpCardTitle}>Deferred Features</div>
          <ul className={styles.mvpList}>
            {mvpRecommendation.deferredFeatures.map((f, i) => (
              <li key={`defer-${i}`}>{f}</li>
            ))}
          </ul>
        </div>
        <div className={styles.mvpCard}>
          <div className={styles.mvpCardTitle}>Technical Architecture</div>
          <div className={styles.mvpPreformatted}>
            {mvpRecommendation.technicalArchitecture}
          </div>
        </div>
        <div className={styles.mvpCard}>
          <div className={styles.mvpCardTitle}>Go-to-Market Plan</div>
          <div className={styles.mvpPreformatted}>
            {mvpRecommendation.goToMarketPlan}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className={styles.supportStat}>
            <div className={styles.supportStatValue}>
              {mvpRecommendation.estimatedTimeline}
            </div>
            <div className={styles.supportStatLabel}>Timeline</div>
          </div>
          <div className={styles.supportStat}>
            <div className={styles.supportStatValue}>
              {mvpRecommendation.teamSize}
            </div>
            <div className={styles.supportStatLabel}>Team Size</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#a5b4fc',
            marginBottom: '10px',
          }}
        >
          Initial Backlog
        </div>
        {mvpRecommendation.initialBacklog.map((item, i) => (
          <div key={`backlog-${i}`} className={styles.backlogItem}>
            <span
              className={styles.backlogPriority}
              style={{
                background: `${getPriorityColor(item.priority)}20`,
                color: getPriorityColor(item.priority),
              }}
            >
              {item.priority}
            </span>
            <span className={styles.backlogEffort}>{item.effort}</span>
            <div style={{ flex: 1 }}>
              <div className={styles.backlogTitle}>{item.title}</div>
              <div className={styles.backlogDesc}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <div className={styles.mvpCard}>
          <div className={styles.mvpCardTitle}>Landing Page Suggestion</div>
          <div className={styles.mvpPreformatted}>
            {mvpRecommendation.landingPageSuggestion}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutputDashboard({ result }: { result: SimulationResult }) {
  const scoreColor = getScoreColor(result.overallScore);

  return (
    <div className={styles.dashboard}>
      {/* Score Header */}
      <div className={styles.scoreHeader}>
        <div
          className={styles.scoreCircle}
          style={{
            border: `3px solid ${scoreColor}`,
            boxShadow: `0 0 20px ${scoreColor}30`,
          }}
        >
          <span className={styles.scoreValue} style={{ color: scoreColor }}>
            {result.overallScore}
          </span>
          <span className={styles.scoreLabel} style={{ color: scoreColor }}>
            Score
          </span>
        </div>
        <div className={styles.scoreDetails}>
          <div className={styles.scoreTitle}>
            Simulation Complete: {result.input.productIdea}
          </div>
          <div className={styles.scoreDescription}>
            Analyzed {result.input.targetCustomers.length} customer segments,{' '}
            {result.input.pricingModels.length} pricing models, and{' '}
            {result.input.competitors.length} competitors. Simulated adoption,
            churn, feature gaps, pricing sensitivity, support burden, and abuse
            scenarios.
          </div>
        </div>
        <span
          className={styles.confidenceBadge}
          style={{
            background:
              result.confidence > 60
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(234, 179, 8, 0.15)',
            color: result.confidence > 60 ? '#86efac' : '#fde047',
          }}
        >
          {result.confidence}% confidence
        </span>
      </div>

      {/* Key Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {result.adoption.totalPredictedUsers.toLocaleString()}
          </div>
          <div className={styles.statLabel}>Predicted Users (12mo)</div>
          <div className={styles.statTrend} style={{ color: '#22c55e' }}>
            {result.adoption.monthlyGrowthRate}% monthly growth
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {result.adoption.timeToProductMarketFit}
          </div>
          <div className={styles.statLabel}>Time to Product-Market Fit</div>
          <div className={styles.statTrend} style={{ color: '#a5b4fc' }}>
            Viral coefficient: {result.adoption.viralCoefficient}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{result.churnRisks.length}</div>
          <div className={styles.statLabel}>Churn Risk Factors</div>
          <div className={styles.statTrend} style={{ color: '#fca5a5' }}>
            {result.churnRisks.filter(r => r.probability > 0.4).length}{' '}
            high-probability
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            $
            {result.pricingSensitivity
              .reduce((sum, p) => sum + p.revenueProjection, 0)
              .toLocaleString()}
          </div>
          <div className={styles.statLabel}>Revenue Projection (12mo)</div>
          <div className={styles.statTrend} style={{ color: '#22c55e' }}>
            Across {result.pricingSensitivity.length} pricing models
          </div>
        </div>
      </div>

      <AdoptionSection result={result} />
      <ObjectionsSection result={result} />
      <ChurnSection result={result} />
      <FeatureGapsSection result={result} />
      <PricingSection result={result} />
      <SupportSection result={result} />
      <AbuseSection result={result} />
      <MVPSection result={result} />
    </div>
  );
}
