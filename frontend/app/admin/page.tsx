"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

interface ModuleOption {
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
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(initialModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(initialLessonForm);
  const [moduleNotice, setModuleNotice] = useState<Notice>(null);
  const [lessonNotice, setLessonNotice] = useState<Notice>(null);
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  const loadModules = useCallback(async () => {
    setIsLoadingModules(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/modules`);

      if (!response.ok) {
        throw new Error("Unable to load modules for the lesson form.");
      }

      const data: ModuleOption[] = await response.json();
      setModules(data);
      setLessonForm((current) => ({
        ...current,
        module_id: current.module_id || (data[0] ? String(data[0].id) : ""),
      }));
    } catch (error) {
      console.error("Error fetching modules:", error);
      setLessonNotice({
        type: "error",
        message: "We could not load modules. Please refresh and try again.",
      });
    } finally {
      setIsLoadingModules(false);
    }
  }, []);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const moduleCountLabel = useMemo(() => {
    if (isLoadingModules) {
      return "Syncing modules...";
    }

    return `${modules.length} module${modules.length === 1 ? "" : "s"} available`;
  }, [isLoadingModules, modules.length]);

  const handleModuleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmittingModule(true);
      setModuleNotice(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/modules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(moduleForm),
        });

        if (!response.ok) {
          throw new Error("Failed to create module.");
        }

        const createdModule: ModuleOption = await response.json();

        setModuleForm(initialModuleForm);
        setModuleNotice({
          type: "success",
          message: `Module \"${createdModule.title}\" created successfully.`,
        });
        await loadModules();
        setLessonForm((current) => ({
          ...current,
          module_id: String(createdModule.id),
        }));
      } catch (error) {
        console.error("Error creating module:", error);
        setModuleNotice({
          type: "error",
          message: "Unable to create the module right now. Please verify the backend is running.",
        });
      } finally {
        setIsSubmittingModule(false);
      }
    },
    [loadModules, moduleForm],
  );

  const handleLessonSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmittingLesson(true);
      setLessonNotice(null);

      const parsedQuizOptions = lessonForm.quiz_options
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);

      try {
        const response = await fetch(`${API_BASE_URL}/api/lessons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            module_id: Number(lessonForm.module_id),
            title: lessonForm.title,
            content_text: lessonForm.content_text,
            content_math: lessonForm.content_math || null,
            video_url: lessonForm.video_url || null,
            quiz_question: lessonForm.quiz_question || null,
            quiz_options: parsedQuizOptions.length > 0 ? parsedQuizOptions : null,
            correct_answer: lessonForm.correct_answer || null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create lesson.");
        }

        const createdLesson = await response.json();

        setLessonForm((current) => ({
          ...initialLessonForm,
          module_id: current.module_id,
        }));
        setLessonNotice({
          type: "success",
          message: `Lesson \"${createdLesson.title}\" created successfully.`,
        });
      } catch (error) {
        console.error("Error creating lesson:", error);
        setLessonNotice({
          type: "error",
          message: "Unable to create the lesson right now. Check the required fields and try again.",
        });
      } finally {
        setIsSubmittingLesson(false);
      }
    },
    [lessonForm],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Admin Studio</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Content Studio</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Publish new modules and lessons for the Delta EE curriculum with a clean internal workflow.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Module Registry</p>
          <p className="mt-2 text-2xl font-bold">{isLoadingModules ? "..." : modules.length}</p>
          <p className="mt-1 text-sm text-slate-300">{moduleCountLabel}</p>
        </div>
      </aside>

      <section className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleModuleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Form 1</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Create Module</h2>
            <p className="mt-2 text-sm text-slate-500">Add a new learning track with a concise title and internal description.</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
              <input
                required
                value={moduleForm.title}
                onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Analog Circuits"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Description</span>
              <textarea
                required
                value={moduleForm.description}
                onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe the outcomes, audience, and scope of this module."
              />
            </label>
          </div>

          {moduleNotice ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                moduleNotice.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {moduleNotice.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmittingModule}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmittingModule ? "Creating Module..." : "Create Module"}
          </button>
        </form>

        <form
          onSubmit={handleLessonSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-600">Form 2</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Create Lesson</h2>
              <p className="mt-2 text-sm text-slate-500">Build a micro-lesson with text, math, video, and quiz metadata.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadModules()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Refresh modules
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Module</span>
              <select
                required
                value={lessonForm.module_id}
                onChange={(event) => setLessonForm((current) => ({ ...current, module_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {modules.length === 0 ? <option value="">No modules available</option> : null}
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
              <input
                required
                value={lessonForm.title}
                onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Kirchhoff's Voltage Law"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Content Text</span>
              <textarea
                required
                value={lessonForm.content_text}
                onChange={(event) => setLessonForm((current) => ({ ...current, content_text: event.target.value }))}
                className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Primary lesson narrative or explanation."
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Content Math</span>
              <textarea
                value={lessonForm.content_math}
                onChange={(event) => setLessonForm((current) => ({ ...current, content_math: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional KaTeX/LaTeX expression."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Video URL</span>
              <input
                value={lessonForm.video_url}
                onChange={(event) => setLessonForm((current) => ({ ...current, video_url: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="https://..."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Correct Answer</span>
              <input
                value={lessonForm.correct_answer}
                onChange={(event) => setLessonForm((current) => ({ ...current, correct_answer: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Final answer for the quiz"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Quiz Question</span>
              <textarea
                value={lessonForm.quiz_question}
                onChange={(event) => setLessonForm((current) => ({ ...current, quiz_question: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional assessment prompt."
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Quiz Options</span>
              <input
                value={lessonForm.quiz_options}
                onChange={(event) => setLessonForm((current) => ({ ...current, quiz_options: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Comma separated values, e.g. Series, Parallel, Hybrid"
              />
            </label>
          </div>

          {lessonNotice ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                lessonNotice.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {lessonNotice.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmittingLesson || modules.length === 0 || isLoadingModules}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmittingLesson ? "Creating Lesson..." : "Create Lesson"}
          </button>
        </form>
      </section>
    </div>
  );
}
