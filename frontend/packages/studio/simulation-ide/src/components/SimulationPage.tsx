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

import { useSimulationStore } from '../store';
import type { CustomerSegment, PricingModel } from '../types';
import { InputForm } from './InputForm';
import { OutputDashboard } from './OutputDashboard';
import styles from '../styles/simulation.module.css';

export function SimulationPage() {
  const { status, activeTab, result, setActiveTab, runSimulation, reset } =
    useSimulationStore();

  const canRun = useSimulationStore(
    (state: { input: { productIdea: string; targetCustomers: CustomerSegment[]; pricingModels: PricingModel[] } }) => {
      const { input } = state;
      return (
        input.productIdea.trim().length > 0 &&
        input.targetCustomers.some((s: CustomerSegment) => s.name.trim().length > 0) &&
        input.pricingModels.some((p: PricingModel) => p.name.trim().length > 0)
      );
    },
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>S</div>
          <div>
            <div className={styles.title}>Infinite Simulation IDE</div>
            <div className={styles.subtitle}>
              Test product ideas against AI-simulated futures
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'input' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('input')}
          >
            Configuration
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!result}
          >
            Results
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {status === 'running' && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>
              Running simulation...
            </div>
            <div className={styles.loadingSubtext}>
              Simulating 100,000 synthetic users across {useSimulationStore.getState().input.targetCustomers.length} segments,{' '}
              {useSimulationStore.getState().input.competitors.length} competitors, and{' '}
              {useSimulationStore.getState().input.pricingModels.length} pricing models
            </div>
          </div>
        )}

        {status !== 'running' && activeTab === 'input' && <InputForm />}

        {status !== 'running' && activeTab === 'results' && result && (
          <OutputDashboard result={result} />
        )}

        {status !== 'running' && activeTab === 'results' && !result && (
          <div className={styles.loading}>
            <div className={styles.loadingText}>
              No simulation results yet
            </div>
            <div className={styles.loadingSubtext}>
              Configure your product inputs and run a simulation to see results
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className={styles.runBar}>
        <button
          type="button"
          className={styles.runBtn}
          onClick={runSimulation}
          disabled={!canRun || status === 'running'}
        >
          {status === 'running' ? 'Simulating...' : 'Run Simulation'}
        </button>
        <button type="button" className={styles.resetBtn} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
