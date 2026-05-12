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

import { create } from 'zustand';

import type {
  SimulationInput,
  SimulationResult,
  SimulationStatus,
  CustomerSegment,
  PricingModel,
  Competitor,
} from './types';
import { SimulationEngine } from './engine';

function createDefaultSegment(): CustomerSegment {
  return {
    id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    description: '',
    size: 'medium',
    techSavviness: 'medium',
    budgetSensitivity: 'medium',
    painPoints: [],
  };
}

function createDefaultPricing(): PricingModel {
  return {
    id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    type: 'subscription',
    price: 29,
    billingCycle: 'monthly',
    features: [],
  };
}

function createDefaultCompetitor(): Competitor {
  return {
    id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    strengths: [],
    weaknesses: [],
    priceRange: '',
    marketShare: 'moderate',
  };
}

interface SimulationStore {
  status: SimulationStatus;
  input: SimulationInput;
  result: SimulationResult | null;
  history: SimulationResult[];
  activeTab: string;

  setStatus: (status: SimulationStatus) => void;
  setActiveTab: (tab: string) => void;
  updateInput: (partial: Partial<SimulationInput>) => void;

  addCustomerSegment: () => void;
  updateCustomerSegment: (id: string, partial: Partial<CustomerSegment>) => void;
  removeCustomerSegment: (id: string) => void;

  addPricingModel: () => void;
  updatePricingModel: (id: string, partial: Partial<PricingModel>) => void;
  removePricingModel: (id: string) => void;

  addCompetitor: () => void;
  updateCompetitor: (id: string, partial: Partial<Competitor>) => void;
  removeCompetitor: (id: string) => void;

  runSimulation: () => void;
  reset: () => void;
}

const defaultInput: SimulationInput = {
  productIdea: '',
  productDescription: '',
  targetCustomers: [createDefaultSegment()],
  pricingModels: [createDefaultPricing()],
  onboardingFlow: '',
  competitors: [createDefaultCompetitor()],
  existingAnalytics: '',
  supportTickets: '',
  landingPageCopy: '',
};

const engine = new SimulationEngine();

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  status: 'idle',
  input: { ...defaultInput },
  result: null,
  history: [],
  activeTab: 'input',

  setStatus: (status: SimulationStatus) => set({ status }),
  setActiveTab: (tab: string) => set({ activeTab: tab }),

  updateInput: (partial: Partial<SimulationInput>) =>
    set(state => ({ input: { ...state.input, ...partial } })),

  addCustomerSegment: () =>
    set(state => ({
      input: {
        ...state.input,
        targetCustomers: [
          ...state.input.targetCustomers,
          createDefaultSegment(),
        ],
      },
    })),

  updateCustomerSegment: (id: string, partial: Partial<CustomerSegment>) =>
    set(state => ({
      input: {
        ...state.input,
        targetCustomers: state.input.targetCustomers.map(s =>
          s.id === id ? { ...s, ...partial } : s,
        ),
      },
    })),

  removeCustomerSegment: (id: string) =>
    set(state => ({
      input: {
        ...state.input,
        targetCustomers: state.input.targetCustomers.filter(s => s.id !== id),
      },
    })),

  addPricingModel: () =>
    set(state => ({
      input: {
        ...state.input,
        pricingModels: [...state.input.pricingModels, createDefaultPricing()],
      },
    })),

  updatePricingModel: (id: string, partial: Partial<PricingModel>) =>
    set(state => ({
      input: {
        ...state.input,
        pricingModels: state.input.pricingModels.map(p =>
          p.id === id ? { ...p, ...partial } : p,
        ),
      },
    })),

  removePricingModel: (id: string) =>
    set(state => ({
      input: {
        ...state.input,
        pricingModels: state.input.pricingModels.filter(p => p.id !== id),
      },
    })),

  addCompetitor: () =>
    set(state => ({
      input: {
        ...state.input,
        competitors: [...state.input.competitors, createDefaultCompetitor()],
      },
    })),

  updateCompetitor: (id: string, partial: Partial<Competitor>) =>
    set(state => ({
      input: {
        ...state.input,
        competitors: state.input.competitors.map(c =>
          c.id === id ? { ...c, ...partial } : c,
        ),
      },
    })),

  removeCompetitor: (id: string) =>
    set(state => ({
      input: {
        ...state.input,
        competitors: state.input.competitors.filter(c => c.id !== id),
      },
    })),

  runSimulation: () => {
    set({ status: 'running' });

    // Simulate async processing delay
    setTimeout(() => {
      const { input } = get();
      const result = engine.run(input);
      set(state => ({
        status: 'complete',
        result,
        history: [result, ...state.history].slice(0, 20),
        activeTab: 'results',
      }));
    }, 1500);
  },

  reset: () =>
    set({
      status: 'idle',
      input: {
        ...defaultInput,
        targetCustomers: [createDefaultSegment()],
        pricingModels: [createDefaultPricing()],
        competitors: [createDefaultCompetitor()],
      },
      result: null,
      activeTab: 'input',
    }),
}));
