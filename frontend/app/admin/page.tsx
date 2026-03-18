"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Module {
  id: number;
  title: string;
  description: string;
}

interface ModuleFormState {
  title: string;
  description: string;
}

interface LessonFormState {
  module_id: string;
  title: string;
  content_text: string;
  content_math: string;
  video_url: string;
  quiz_question: string;
  quiz_options: string;
  correct_answer: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

const initialModuleForm: ModuleFormState = {
  title: "",
  description: "",
};

const initialLessonForm: LessonFormState = {
  module_id: "",
  title: "",
  content_text: "",
  content_math: "",
  video_url: "",
  quiz_question: "",
  quiz_options: "",
  correct_answer: "",
};

export default function AdminStudioPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(initialModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(initialLessonForm);
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [moduleStatus, setModuleStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lessonStatus, setLessonStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchModules = useCallback(async () => {
    setLoadingModules(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/modules`);

      if (!response.ok) {
        throw new Error("Unable to load modules.");
      }

      const data: Module[] = await response.json();
      setModules(data);
      setLessonForm((current) => ({
        ...current,
        module_id: current.module_id || data[0]?.id?.toString() || "",
      }));
    } catch (error) {
      console.error("Error fetching modules:", error);
      setModuleStatus({
        type: "error",
        message: "Unable to load existing modules. Verify the backend is running.",
      });
    } finally {
      setLoadingModules(false);
    }
  }, []);

  useEffect(() => {
    void fetchModules();
  }, [fetchModules]);

  const lessonOptionsPreview = useMemo(
    () => lessonForm.quiz_options.split(",").map((option) => option.trim()).filter(Boolean),
    [lessonForm.quiz_options],
  );

  const handleModuleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModuleSubmitting(true);
    setModuleStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moduleForm),
      });

      if (!response.ok) {
        throw new Error("Module creation failed.");
      }

      const createdModule: Module = await response.json();
      setModuleStatus({ type: "success", message: `Module \"${createdModule.title}\" created successfully.` });
      setModuleForm(initialModuleForm);
      setModules((current) => [...current, createdModule]);
      setLessonForm((current) => ({
        ...current,
        module_id: current.module_id || createdModule.id.toString(),
      }));
    } catch (error) {
      console.error("Error creating module:", error);
      setModuleStatus({ type: "error", message: "We could not create the module. Please try again." });
    } finally {
      setModuleSubmitting(false);
    }
  }, [moduleForm]);

  const handleLessonSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLessonSubmitting(true);
    setLessonStatus(null);

    try {
      const payload = {
        module_id: Number(lessonForm.module_id),
        title: lessonForm.title,
        content_text: lessonForm.content_text,
        content_math: lessonForm.content_math || null,
        video_url: lessonForm.video_url || null,
        quiz_question: lessonForm.quiz_question || null,
        quiz_options: lessonOptionsPreview.length > 0 ? lessonOptionsPreview : null,
        correct_answer: lessonForm.correct_answer || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Lesson creation failed.");
      }

      const createdLesson = await response.json();
      setLessonStatus({ type: "success", message: `Lesson \"${createdLesson.title}\" created successfully.` });
      setLessonForm({ ...initialLessonForm, module_id: lessonForm.module_id });
    } catch (error) {
      console.error("Error creating lesson:", error);
      setLessonStatus({ type: "error", message: "We could not create the lesson. Please review the form and try again." });
    } finally {
      setLessonSubmitting(false);
    }
  }, [lessonForm, lessonOptionsPreview]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Content Studio</p>
        <h1 className="mt-4 text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Create new learning modules and lessons for the Delta EE content pipeline.
        </p>

        <div className="mt-8 rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Catalog status</p>
          <p className="mt-3 text-4xl font-semibold">{loadingModules ? "…" : modules.length}</p>
          <p className="mt-2 text-sm text-slate-300">Existing modules available for lesson assignment.</p>
        </div>
      </aside>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleModuleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Form 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create module</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">FastAPI → /api/modules</span>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
              <input
                required
                value={moduleForm.title}
                onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Signals & Systems"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                required
                value={moduleForm.description}
                onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Overview, learning outcomes, and audience details."
              />
            </label>
          </div>

          {moduleStatus ? (
            <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${moduleStatus.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {moduleStatus.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={moduleSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {moduleSubmitting ? "Creating module..." : "Create module"}
          </button>
        </form>

        <form onSubmit={handleLessonSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Form 2</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create lesson</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">FastAPI → /api/lessons</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Module</span>
              <select
                required
                value={lessonForm.module_id}
                onChange={(event) => setLessonForm((current) => ({ ...current, module_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                disabled={loadingModules || modules.length === 0}
              >
                <option value="">Select a module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Lesson title</span>
              <input
                required
                value={lessonForm.title}
                onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Laplace Transform Basics"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Content text</span>
              <textarea
                required
                value={lessonForm.content_text}
                onChange={(event) => setLessonForm((current) => ({ ...current, content_text: event.target.value }))}
                className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Explain the concept in concise instructional language."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Content math</span>
              <input
                value={lessonForm.content_math}
                onChange={(event) => setLessonForm((current) => ({ ...current, content_math: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="F(s) = ∫₀^∞ f(t)e^{-st} dt"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Video URL</span>
              <input
                value={lessonForm.video_url}
                onChange={(event) => setLessonForm((current) => ({ ...current, video_url: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="https://..."
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Quiz question</span>
              <input
                value={lessonForm.quiz_question}
                onChange={(event) => setLessonForm((current) => ({ ...current, quiz_question: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Which transform-domain variable is most common for continuous-time systems?"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Quiz options</span>
              <input
                value={lessonForm.quiz_options}
                onChange={(event) => setLessonForm((current) => ({ ...current, quiz_options: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="s, z, ω"
              />
              <p className="mt-2 text-xs text-slate-500">
                Comma separated. Parsed preview: {lessonOptionsPreview.length > 0 ? lessonOptionsPreview.join(" • ") : "No options yet."}
              </p>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Correct answer</span>
              <input
                value={lessonForm.correct_answer}
                onChange={(event) => setLessonForm((current) => ({ ...current, correct_answer: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="s"
              />
            </label>
          </div>

          {lessonStatus ? (
            <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${lessonStatus.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {lessonStatus.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={lessonSubmitting || loadingModules || modules.length === 0}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {lessonSubmitting ? "Creating lesson..." : "Create lesson"}
          </button>
        </form>
      </section>
    </div>
  );
}
