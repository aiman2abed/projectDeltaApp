"use client";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface MathRendererProps {
  formula: string;
}

export default function MathRenderer({ formula }: MathRendererProps) {
  return (
    <div className="bg-white p-4 rounded border border-blue-100 text-center text-xl overflow-x-auto my-4 shadow-sm">
      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 text-left">
        Core Formula
      </p>
      <div className="text-blue-900">
        <BlockMath math={formula} />
      </div>
    </div>
  );
}