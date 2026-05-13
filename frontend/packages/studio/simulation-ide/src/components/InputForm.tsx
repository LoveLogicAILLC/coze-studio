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

import React, { useCallback } from 'react';

import { useSimulationStore } from '../store';
import type { CustomerSegment, PricingModel, Competitor } from '../types';
import styles from '../styles/simulation.module.css';

function TagEditor({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
        e.preventDefault();
        onChange([...tags, e.currentTarget.value.trim()]);
        e.currentTarget.value = '';
      }
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange],
  );

  return (
    <div className={styles.tagInput}>
      {tags.map((tag, i) => (
        <span key={`${tag}-${i}`} className={styles.tag}>
          {tag}
          <span
            className={styles.tagRemove}
            onClick={() => removeTag(i)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter') removeTag(i);
            }}
          >
            x
          </span>
        </span>
      ))}
      <input
        type="text"
        className={styles.tagInputField}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

function CustomerSegmentItem({
  segment,
  index,
}: {
  segment: CustomerSegment;
  index: number;
}) {
  const { updateCustomerSegment, removeCustomerSegment } =
    useSimulationStore();

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemHeader}>
        <span className={styles.listItemTitle}>Segment {index + 1}</span>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => removeCustomerSegment(segment.id)}
        >
          Remove
        </button>
      </div>
      <div className={styles.inlineFields}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={segment.name}
            onChange={e =>
              updateCustomerSegment(segment.id, { name: e.target.value })
            }
            placeholder="e.g., SMB SaaS Teams"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Size</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={segment.size}
            onChange={e =>
              updateCustomerSegment(segment.id, {
                size: e.target.value as CustomerSegment['size'],
              })
            }
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <input
          className={styles.input}
          value={segment.description}
          onChange={e =>
            updateCustomerSegment(segment.id, {
              description: e.target.value,
            })
          }
          placeholder="Brief description of this customer segment"
        />
      </div>
      <div className={styles.inlineFields}>
        <div className={styles.field}>
          <label className={styles.label}>Tech Savviness</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={segment.techSavviness}
            onChange={e =>
              updateCustomerSegment(segment.id, {
                techSavviness: e.target.value as CustomerSegment['techSavviness'],
              })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Budget Sensitivity</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={segment.budgetSensitivity}
            onChange={e =>
              updateCustomerSegment(segment.id, {
                budgetSensitivity:
                  e.target.value as CustomerSegment['budgetSensitivity'],
              })
            }
          >
            <option value="low">Low (Price Insensitive)</option>
            <option value="medium">Medium</option>
            <option value="high">High (Very Price Sensitive)</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Pain Points (press Enter to add)</label>
        <TagEditor
          tags={segment.painPoints}
          onChange={painPoints =>
            updateCustomerSegment(segment.id, { painPoints })
          }
          placeholder="Add a pain point..."
        />
      </div>
    </div>
  );
}

function PricingModelItem({
  model,
  index,
}: {
  model: PricingModel;
  index: number;
}) {
  const { updatePricingModel, removePricingModel } = useSimulationStore();

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemHeader}>
        <span className={styles.listItemTitle}>Pricing Tier {index + 1}</span>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => removePricingModel(model.id)}
        >
          Remove
        </button>
      </div>
      <div className={styles.inlineFields}>
        <div className={styles.field}>
          <label className={styles.label}>Tier Name</label>
          <input
            className={styles.input}
            value={model.name}
            onChange={e =>
              updatePricingModel(model.id, { name: e.target.value })
            }
            placeholder="e.g., Pro Plan"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Type</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={model.type}
            onChange={e =>
              updatePricingModel(model.id, {
                type: e.target.value as PricingModel['type'],
              })
            }
          >
            <option value="freemium">Freemium</option>
            <option value="subscription">Subscription</option>
            <option value="usage-based">Usage Based</option>
            <option value="one-time">One Time</option>
            <option value="tiered">Tiered</option>
          </select>
        </div>
      </div>
      <div className={styles.inlineFields}>
        <div className={styles.field}>
          <label className={styles.label}>Price ($)</label>
          <input
            type="number"
            className={styles.input}
            value={model.price}
            onChange={e =>
              updatePricingModel(model.id, {
                price: Number(e.target.value),
              })
            }
            min={0}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Billing Cycle</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={model.billingCycle}
            onChange={e =>
              updatePricingModel(model.id, {
                billingCycle: e.target.value as PricingModel['billingCycle'],
              })
            }
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="one-time">One Time</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Features (press Enter to add)</label>
        <TagEditor
          tags={model.features}
          onChange={features =>
            updatePricingModel(model.id, { features })
          }
          placeholder="Add a feature..."
        />
      </div>
    </div>
  );
}

function CompetitorItem({
  competitor,
  index,
}: {
  competitor: Competitor;
  index: number;
}) {
  const { updateCompetitor, removeCompetitor } = useSimulationStore();

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemHeader}>
        <span className={styles.listItemTitle}>Competitor {index + 1}</span>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => removeCompetitor(competitor.id)}
        >
          Remove
        </button>
      </div>
      <div className={styles.inlineFields}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={competitor.name}
            onChange={e =>
              updateCompetitor(competitor.id, { name: e.target.value })
            }
            placeholder="e.g., Notion AI"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Market Share</label>
          <select
            className={`${styles.input} ${styles.select}`}
            value={competitor.marketShare}
            onChange={e =>
              updateCompetitor(competitor.id, {
                marketShare: e.target.value as Competitor['marketShare'],
              })
            }
          >
            <option value="dominant">Dominant</option>
            <option value="significant">Significant</option>
            <option value="moderate">Moderate</option>
            <option value="niche">Niche</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Price Range</label>
        <input
          className={styles.input}
          value={competitor.priceRange}
          onChange={e =>
            updateCompetitor(competitor.id, {
              priceRange: e.target.value,
            })
          }
          placeholder="e.g., $10-50/mo"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Strengths (press Enter)</label>
        <TagEditor
          tags={competitor.strengths}
          onChange={strengths =>
            updateCompetitor(competitor.id, { strengths })
          }
          placeholder="Add strength..."
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Weaknesses (press Enter)</label>
        <TagEditor
          tags={competitor.weaknesses}
          onChange={weaknesses =>
            updateCompetitor(competitor.id, { weaknesses })
          }
          placeholder="Add weakness..."
        />
      </div>
    </div>
  );
}

export function InputForm() {
  const {
    input,
    updateInput,
    addCustomerSegment,
    addPricingModel,
    addCompetitor,
  } = useSimulationStore();

  return (
    <div className={styles.formGrid}>
      {/* Product Idea */}
      <div className={`${styles.formSection} ${styles.formSectionFull}`}>
        <div className={styles.sectionTitle}>Product Concept</div>
        <div className={styles.sectionDesc}>
          Describe the core product idea and its value proposition
        </div>
        <div className={styles.inlineFields}>
          <div className={styles.field}>
            <label className={styles.label}>Product Name / Idea</label>
            <input
              className={styles.input}
              value={input.productIdea}
              onChange={e => updateInput({ productIdea: e.target.value })}
              placeholder="e.g., AI Meeting Notes for Sales Teams"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={input.productDescription}
              onChange={e =>
                updateInput({ productDescription: e.target.value })
              }
              placeholder="Brief description of core value proposition"
            />
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Target Customer Segments</div>
        <div className={styles.sectionDesc}>
          Define who will use and buy this product
        </div>
        {input.targetCustomers.map((segment: CustomerSegment, i: number) => (
          <CustomerSegmentItem key={segment.id} segment={segment} index={i} />
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={addCustomerSegment}
        >
          + Add Segment
        </button>
      </div>

      {/* Pricing Models */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Pricing Models</div>
        <div className={styles.sectionDesc}>
          Define pricing tiers and monetization strategy
        </div>
        {input.pricingModels.map((model: PricingModel, i: number) => (
          <PricingModelItem key={model.id} model={model} index={i} />
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={addPricingModel}
        >
          + Add Pricing Tier
        </button>
      </div>

      {/* Competitors */}
      <div className={`${styles.formSection} ${styles.formSectionFull}`}>
        <div className={styles.sectionTitle}>Competitive Landscape</div>
        <div className={styles.sectionDesc}>
          List key competitors and their positioning
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {input.competitors.map((comp: Competitor, i: number) => (
            <CompetitorItem key={comp.id} competitor={comp} index={i} />
          ))}
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={addCompetitor}
        >
          + Add Competitor
        </button>
      </div>

      {/* Onboarding & Context */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Onboarding Flow</div>
        <div className={styles.sectionDesc}>
          Describe the intended user onboarding experience
        </div>
        <div className={styles.field}>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={input.onboardingFlow}
            onChange={e => updateInput({ onboardingFlow: e.target.value })}
            placeholder="Describe the step-by-step onboarding process..."
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Additional Context</div>
        <div className={styles.sectionDesc}>
          Provide any existing data to improve simulation accuracy
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Existing Analytics</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={input.existingAnalytics}
            onChange={e => updateInput({ existingAnalytics: e.target.value })}
            placeholder="Paste any existing product analytics, user research, or market data..."
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Support Tickets / Feedback</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={input.supportTickets}
            onChange={e => updateInput({ supportTickets: e.target.value })}
            placeholder="Common support issues, feature requests, or user feedback..."
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Landing Page Copy</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={input.landingPageCopy}
            onChange={e => updateInput({ landingPageCopy: e.target.value })}
            placeholder="Current or planned landing page messaging..."
          />
        </div>
      </div>
    </div>
  );
}
