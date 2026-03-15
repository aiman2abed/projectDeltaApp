"use client";
import React from "react";
import type { ModuleProgressSummary } from "@/types/api";

interface MasteryChartProps {
  data: ModuleProgressSummary[];
}

export default function MasteryChart({ data }: MasteryChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 italic">No progress data available.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📊</span> Engineering Tracks Mastery
      </h2>
      
      <div className="space-y-6">
        {data.map((track) => (
          <div key={track.module_id} className="w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-bold text-blue-900">{track.module_title}</h3>
                <p className="text-xs text-gray-500">
                  {track.lessons_started} of {track.total_lessons} lessons started
                </p>
              </div>
              <span className="text-sm font-black text-blue-700">
                {track.mastery_score}%
              </span>
            </div>
            
            {/* The Progress Bar Background */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
              {/* The Dynamic Fill */}
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${track.mastery_score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}