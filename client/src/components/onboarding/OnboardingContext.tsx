import { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from "react";
import { GoalType } from "./GoalCard";

// Types
export interface OnboardingData {
  firstName: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  currentWeightKg: number;
  goal: GoalType | null;
}

export interface CalculatedTargets {
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  recommendedPhase: string;
}

export interface OnboardingState {
  screen: 1 | 2 | 3 | 4;
  data: OnboardingData;
  calculated: CalculatedTargets | null;
  isReturningUser: boolean;
  prefillData: Partial<OnboardingData> | null;
}

type OnboardingAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_METRICS"; payload: Partial<OnboardingData> }
  | { type: "SET_GOAL"; payload: GoalType }
  | { type: "NEXT_SCREEN" }
  | { type: "PREV_SCREEN" }
  | { type: "GO_TO_SCREEN"; payload: 1 | 2 | 3 | 4 }
  | { type: "SET_CALCULATED"; payload: CalculatedTargets }
  | { type: "SET_PREFILL"; payload: { data: Partial<OnboardingData>; isReturning: boolean } }
  | { type: "RESET" };

// Storage keys
const STORAGE_KEY = "vitalpath_onboarding_v2";
const SCREEN_KEY = "vitalpath_onboarding_v2_screen";

// Initial state
const initialData: OnboardingData = {
  firstName: "",
  age: 0,
  sex: "male",
  heightCm: 0,
  currentWeightKg: 0,
  goal: null,
};

const initialState: OnboardingState = {
  screen: 1,
  data: initialData,
  calculated: null,
  isReturningUser: false,
  prefillData: null,
};

// Load saved state from localStorage
function loadSavedState(): Partial<OnboardingState> {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedScreen = localStorage.getItem(SCREEN_KEY);

    return {
      data: savedData ? JSON.parse(savedData) : undefined,
      screen: savedScreen ? (parseInt(savedScreen) as 1 | 2 | 3 | 4) : undefined,
    };
  } catch {
    return {};
  }
}

// Save state to localStorage
function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    localStorage.setItem(SCREEN_KEY, state.screen.toString());
  } catch {
    // localStorage not available
  }
}

// Clear saved state
export function clearOnboardingStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SCREEN_KEY);
  } catch {
    // localStorage not available
  }
}

// Reducer
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "SET_NAME":
      return {
        ...state,
        data: { ...state.data, firstName: action.payload },
      };

    case "SET_METRICS":
      return {
        ...state,
        data: { ...state.data, ...action.payload },
      };

    case "SET_GOAL":
      return {
        ...state,
        data: { ...state.data, goal: action.payload },
      };

    case "NEXT_SCREEN":
      return {
        ...state,
        screen: Math.min(state.screen + 1, 4) as 1 | 2 | 3 | 4,
      };

    case "PREV_SCREEN":
      return {
        ...state,
        screen: Math.max(state.screen - 1, 1) as 1 | 2 | 3 | 4,
      };

    case "GO_TO_SCREEN":
      return {
        ...state,
        screen: action.payload,
      };

    case "SET_CALCULATED":
      return {
        ...state,
        calculated: action.payload,
      };

    case "SET_PREFILL":
      return {
        ...state,
        prefillData: action.payload.data,
        isReturningUser: action.payload.isReturning,
        data: {
          ...state.data,
          ...action.payload.data,
        },
      };

    case "RESET":
      clearOnboardingStorage();
      return initialState;

    default:
      return state;
  }
}

// Context
interface OnboardingContextValue {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  // Convenience actions
  setName: (name: string) => void;
  setMetrics: (metrics: Partial<OnboardingData>) => void;
  setGoal: (goal: GoalType) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  goToScreen: (screen: 1 | 2 | 3 | 4) => void;
  setCalculated: (targets: CalculatedTargets) => void;
  setPrefill: (data: Partial<OnboardingData>, isReturning: boolean) => void;
  reset: () => void;
  // Validation
  canProceedFromScreen: (screen: number) => boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// Provider
interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  // Load saved state and merge with initial
  const savedState = useMemo(() => loadSavedState(), []);
  const mergedInitialState: OnboardingState = {
    ...initialState,
    data: { ...initialData, ...savedState.data },
    screen: savedState.screen || 1,
  };

  const [state, dispatch] = useReducer(onboardingReducer, mergedInitialState);

  // Auto-save state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Convenience action creators
  const value: OnboardingContextValue = useMemo(() => ({
    state,
    dispatch,
    setName: (name: string) => dispatch({ type: "SET_NAME", payload: name }),
    setMetrics: (metrics: Partial<OnboardingData>) => dispatch({ type: "SET_METRICS", payload: metrics }),
    setGoal: (goal: GoalType) => dispatch({ type: "SET_GOAL", payload: goal }),
    nextScreen: () => dispatch({ type: "NEXT_SCREEN" }),
    prevScreen: () => dispatch({ type: "PREV_SCREEN" }),
    goToScreen: (screen: 1 | 2 | 3 | 4) => dispatch({ type: "GO_TO_SCREEN", payload: screen }),
    setCalculated: (targets: CalculatedTargets) => dispatch({ type: "SET_CALCULATED", payload: targets }),
    setPrefill: (data: Partial<OnboardingData>, isReturning: boolean) =>
      dispatch({ type: "SET_PREFILL", payload: { data, isReturning } }),
    reset: () => dispatch({ type: "RESET" }),
    canProceedFromScreen: (screen: number) => {
      switch (screen) {
        case 1:
          // Screen 1 just needs to be viewed
          return true;
        case 2:
          // Screen 2 needs name and basic metrics
          const { firstName, age, sex, heightCm, currentWeightKg } = state.data;
          return (
            firstName.trim().length > 0 &&
            age >= 18 &&
            age <= 120 &&
            (sex === "male" || sex === "female") &&
            heightCm >= 100 &&
            heightCm <= 250 &&
            currentWeightKg >= 30 &&
            currentWeightKg <= 300
          );
        case 3:
          // Screen 3 needs a goal selected
          return state.data.goal !== null;
        case 4:
          // Screen 4 needs calculations done
          return state.calculated !== null;
        default:
          return false;
      }
    },
  }), [state, dispatch]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

// Calculate targets based on user data (client-side version)
export function calculateInitialTargets(data: OnboardingData): CalculatedTargets {
  const { age, sex, heightCm, currentWeightKg, goal } = data;

  // Mifflin-St Jeor BMR calculation
  let bmr: number;
  if (sex === "male") {
    bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Use sedentary activity level as default (conservative)
  const activityMultiplier = 1.2;
  const maintenanceCalories = Math.round(bmr * activityMultiplier);

  // Map goal to phase and deficit
  let recommendedPhase: string;
  let targetCalories: number;

  switch (goal) {
    case "lose_weight":
      recommendedPhase = "cutting";
      targetCalories = Math.round(maintenanceCalories * 0.85); // 15% deficit
      break;
    case "build_strength":
      recommendedPhase = "recomp";
      targetCalories = Math.round(maintenanceCalories * 0.95); // 5% deficit
      break;
    case "more_energy":
      recommendedPhase = "recovery";
      targetCalories = maintenanceCalories; // Maintenance
      break;
    case "feel_better":
    default:
      recommendedPhase = "recomp";
      targetCalories = Math.round(maintenanceCalories * 0.95);
      break;
  }

  // Ensure minimum calories (85% of BMR)
  const minCalories = Math.round(bmr * 0.85);
  targetCalories = Math.max(targetCalories, minCalories);

  // Calculate macros
  // Protein: 1.8g per kg for 40+ (higher to preserve muscle)
  const proteinGrams = Math.round(currentWeightKg * 1.8);

  // Fat: 0.8g per kg
  const fatGrams = Math.round(currentWeightKg * 0.8);

  // Carbs: remaining calories / 4 (minimum 100g)
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.max(100, Math.round(remainingCalories / 4));

  return {
    maintenanceCalories,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    recommendedPhase,
  };
}
