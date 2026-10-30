export type QuizCategory = "evidence" | "knowledge" | "calculation" | "concepts";

export interface SingleQuestion {
  kind: "single"; id: string; prompt: string; options: string[]; answer: number; explanation: string; claims?: string[];
}
export interface NumericQuestion {
  kind: "numeric"; id: string; prompt: string; unit: string; /** Computed by the finance library so the quiz can never drift from the tools. */ expected: () => number;
  tolerance: number; explanation: string; claims?: string[];
}
export type Question = SingleQuestion | NumericQuestion;

export interface Quiz { slug: string; title: string; category: QuizCategory; summary: string; passPercent: number; questions: Question[] }

export interface QuestionResult { id: string; correct: boolean; given: string; expectedLabel: string }
export interface QuizResult { score: number; max: number; percent: number; passed: boolean; results: QuestionResult[] }
