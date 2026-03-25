"use client";
import React, { useEffect, useRef, useState } from "react";

interface QuizEngineProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onSuccess: (isFirstTry: boolean) => void;
}

export default function QuizEngine({ question, options, correctAnswer, onSuccess }: QuizEngineProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hadIncorrectAttempt, setHadIncorrectAttempt] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!selected) return;

    setHasSubmitted(true);
    const correct = selected === correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      // If they never failed, it's a perfect first try (SM-2 Quality 4 or 5)
      const isFirstTry = !hadIncorrectAttempt;
      
      successTimeoutRef.current = setTimeout(() => {
        onSuccess(isFirstTry);
      }, 1500); // 1.5s delay to admire the green glow
      return;
    }

    // Flag that they missed it, so next time they submit, isFirstTry will be false
    setHadIncorrectAttempt(true);
  };

  return (
    <div className="w-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel-active p-8 sm:p-10 rounded-3xl relative overflow-hidden">
        
        {/* Ambient background glows based on right/wrong state */}
        {hasSubmitted && isCorrect && (
          <div className="absolute inset-0 bg-emerald-500/10 blur-3xl animate-in fade-in duration-500 pointer-events-none" />
        )}
        {hasSubmitted && !isCorrect && (
          <div className="absolute inset-0 bg-red-500/10 blur-3xl animate-in fade-in duration-500 pointer-events-none" />
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-2 h-2 rounded-full ${hasSubmitted ? (isCorrect ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]') : 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Knowledge Check
            </span>
          </div>
          
          <h3 className="text-2xl font-extrabold text-white mb-8 leading-relaxed">
            {question}
          </h3>

          <div className="space-y-4 mb-8">
            {options.map((option, index) => {
              // Base Cyber-Physical Button Style
              let buttonStyle = "glass-panel border-white/5 text-slate-300 hover:border-sky-500/30 hover:bg-white/5 cursor-pointer";
              let letterStyle = "text-sky-400 bg-black/40 border-white/5 group-hover:border-sky-500/30";

              // Active Selection Style
              if (selected === option && !hasSubmitted) {
                buttonStyle = "border-sky-500/50 bg-sky-500/10 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]";
                letterStyle = "text-sky-300 border-sky-500/50 bg-sky-500/20";
              }

              // Post-Submission Styles
              if (hasSubmitted) {
                if (option === correctAnswer) {
                  // The Right Answer (Always glows green, even if you missed it and are reviewing)
                  buttonStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.2)] cursor-default transform scale-[1.01]";
                  letterStyle = "text-emerald-400 border-emerald-500/30 bg-emerald-500/20";
                } else if (selected === option && !isCorrect) {
                  // The Wrong Answer You Clicked (Red Shake)
                  buttonStyle = "border-red-500/50 bg-red-500/10 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.2)] cursor-default animate-shake";
                  letterStyle = "text-red-400 border-red-500/30 bg-red-500/20";
                } else {
                  // Wrong answers you didn't click fade out
                  buttonStyle = "border-white/5 bg-black/20 text-slate-500 opacity-50 cursor-default";
                  letterStyle = "text-slate-600 border-white/5 bg-black/40";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isCorrect) return; // Prevent clicking after solving
                    setSelected(option);
                    setHasSubmitted(false); // Reset submission state so they can try again
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group flex items-center gap-4 ${buttonStyle}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${letterStyle}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium relative z-10">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Action Area */}
          {!isCorrect && (
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                selected
                  ? "shadow-[0_0_20px_rgba(56,189,248,0.2)] text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
              }`}
            >
              {hasSubmitted && !isCorrect ? "Recalibrate & Retry" : "Initialize Validation"}
            </button>
          )}

          {isCorrect && (
            <div className="w-full py-4 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold text-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2 animate-in fade-in duration-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Validation Successful. Node Unlocked.
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}