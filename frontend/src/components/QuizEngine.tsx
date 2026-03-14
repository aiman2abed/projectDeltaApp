"use client";
import React, { useState } from "react";

interface QuizEngineProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onSuccess: () => void; // The flare gun to alert the Motherboard
}

export default function QuizEngine({ question, options, correctAnswer, onSuccess }: QuizEngineProps) {
  // Local state to track what the user is doing
  const [selected, setSelected] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    
    setHasSubmitted(true);
    const correct = selected === correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      onSuccess(); // Fire the flare to the parent page!
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Knowledge Check</h3>
      <p className="text-gray-700 font-medium mb-4">{question}</p>
      
      <div className="space-y-3 mb-6">
        {options.map((option, index) => {
          // Dynamic styling based on state
          let buttonStyle = "border-gray-300 text-gray-700 hover:bg-blue-50";
          
          if (selected === option) {
            buttonStyle = "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600";
          }
          
          if (hasSubmitted && option === correctAnswer) {
            buttonStyle = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
          } else if (hasSubmitted && selected === option && !isCorrect) {
            buttonStyle = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
          }

          return (
            <button
              key={index}
              onClick={() => {
                // Prevent changing answer after submitting correctly
                if (isCorrect) return; 
                setSelected(option);
                setHasSubmitted(false); // Reset if they try again
              }}
              className={`w-full text-left p-3 rounded-md border transition-all duration-200 ${buttonStyle}`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          );
        })}
      </div>

      {!isCorrect && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`w-full py-3 rounded-md font-bold transition-all duration-200 ${
            selected 
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {hasSubmitted && !isCorrect ? "Try Again" : "Submit Answer"}
        </button>
      )}

      {isCorrect && (
        <div className="w-full py-3 bg-green-100 text-green-800 rounded-md font-bold text-center border border-green-300">
          ✅ Correct! Lesson Unlocked.
        </div>
      )}
    </div>
  );
}