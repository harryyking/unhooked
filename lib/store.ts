// lib/store.ts
import { create } from 'zustand';

interface AppState {
  quizScore: number;
  setQuizScore: (score: number) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quizScore: 0,
  setQuizScore: (score) => set({ quizScore: score }),
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
}));