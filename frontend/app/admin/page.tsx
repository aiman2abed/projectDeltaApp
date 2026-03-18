"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Module {
  id: number;
  title: string;
  description: string;
}

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_text: string;
  content_math: string | null;
  video_url: string | null;
  quiz_question: string | null;
  quiz_options: string[] | null;
  correct_answer: string | null;
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

const initialModuleForm: ModuleFormState = { title: "", description: "" };
const initialLessonForm: LessonFormState = {
  module_id: "", title: "", content_text: "", content_math: "",
  video_url: "", quiz_question: "", quiz_options: "", correct_answer: "",
};

export default function AdminStudioPage() {
  // --- CORE STATE ---
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  // --- FORM STATE ---
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(initialModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(initialLessonForm);
  
  // --- EDIT MODE STATE (The secret sauce for reusability) ---
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  // --- MANAGE VIEW STATE ---
  const [selectedManageModuleId, setSelectedManageModuleId] = useState<number | null>(null);
  const [manageLessons, setManageLessons] = useState<Lesson[]>([]);

  // --- SUBMISSION UI STATE ---
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [moduleStatus, setModuleStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lessonStatus, setLessonStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch Modules on mount
  const fetchModules = useCallback(async () => {
    setLoadingModules(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules`);
      if (response.ok) {
        const data: Module[] = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoadingModules(false);
    }
  }, []);

  useEffect(() => {
    void fetchModules();
  }, [fetchModules]);

  // Fetch Lessons for the Manage Tab when a module is clicked
  const fetchManageLessons = async (moduleId: number) => {
    setSelectedManageModuleId(moduleId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/${moduleId}/lessons`);
      if (res.ok) {
        setManageLessons(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch lessons for management.", error);
    }
  };

  const lessonOptionsPreview = useMemo(
    () => lessonForm.quiz_options.split(",").map((option) => option.trim()).filter(Boolean),
    [lessonForm.quiz_options]
  );

  // ==========================================
  // MODULE CRUD HANDLERS
  // ==========================================

  const handleModuleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModuleSubmitting(true);
    setModuleStatus(null);

    const isEditing = editingModuleId !== null;
    const url = isEditing ? `${API_BASE_URL}/api/modules/${editingModuleId}` : `${API_BASE_URL}/api/modules`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleForm),
      });

      if (!response.ok) throw new Error("Module save failed.");

      setModuleStatus({ type: "success", message: `Module ${isEditing ? "updated" : "created"} successfully!` });
      setModuleForm(initialModuleForm);
      setEditingModuleId(null);
      fetchModules(); // Refresh list
    } catch (error) {
      setModuleStatus({ type: "error", message: "Error saving module. Try again." });
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!window.confirm("WARNING: This will delete the module AND all lessons inside it. Are you sure?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/modules/${id}`, { method: "DELETE" });
      fetchModules();
      if (selectedManageModuleId === id) setSelectedManageModuleId(null);
    } catch (error) {
      alert("Failed to delete module.");
    }
  };

  const handleEditModuleClick = (mod: Module) => {
    setModuleForm({ title: mod.title, description: mod.description });
    setEditingModuleId(mod.id);
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // LESSON CRUD HANDLERS
  // ==========================================

  const handleLessonSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLessonSubmitting(true);
    setLessonStatus(null);

    const isEditing = editingLessonId !== null;
    const url = isEditing ? `${API_BASE_URL}/api/lessons/${editingLessonId}` : `${API_BASE_URL}/api/lessons`;
    const method = isEditing ? "PUT" : "POST";

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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Lesson save failed.");

      setLessonStatus({ type: "success", message: `Lesson ${isEditing ? "updated" : "created"} successfully!` });
      setLessonForm({ ...initialLessonForm, module_id: lessonForm.module_id }); // Keep module selected
      setEditingLessonId(null);
    } catch (error) {
      setLessonStatus({ type: "error", message: "Error saving lesson. Try again." });
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number, moduleId: number) => {
    if (!window.confirm("Delete this lesson permanently?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, { method: "DELETE" });
      fetchManageLessons(moduleId); // Refresh lesson list
    } catch (error) {
      alert("Failed to delete lesson.");
    }
  };

  const handleEditLessonClick = (les: Lesson) => {
    setLessonForm({
      module_id: les.module_id.toString(),
      title: les.title,
      content_text: les.content_text,
      content_math: les.content_math || "",
      video_url: les.video_url || "",
      quiz_question: les.quiz_question || "",
      quiz_options: les.quiz_options ? les.quiz_options.join(", ") : "",
      correct_answer: les.correct_answer || "",
    });
    setEditingLessonId(les.id);
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingModuleId(null);
    setEditingLessonId(null);
    setModuleForm(initialModuleForm);
    setLessonForm(initialLessonForm);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* SIDEBAR */}
      <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl flex flex-col h-max">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Content Studio</p>
        <h1 className="mt-4 text-3xl font-semibold">Admin</h1>
        
        <div className="mt-8 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("create")}
            className={`px-4 py-3 rounded-xl text-left font-medium transition ${activeTab === "create" ? "bg-cyan-600 text-white" : "hover:bg-white/10 text-slate-300"}`}
          >
            ✏️ Author Content
          </button>
          <button 
            onClick={() => { setActiveTab("manage"); cancelEdit(); }}
            className={`px-4 py-3 rounded-xl text-left font-medium transition ${activeTab === "manage" ? "bg-cyan-600 text-white" : "hover:bg-white/10 text-slate-300"}`}
          >
            🗂️ Manage Catalog
          </button>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Modules</p>
          <p className="mt-1 text-4xl font-semibold">{loadingModules ? "…" : modules.length}</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm min-h-[70vh]">
        
        {/* ==========================================
            TAB 1: CREATE / EDIT FORMS
            ========================================== */}
        {activeTab === "create" && (
          <div className="grid gap-12 xl:grid-cols-2">
            
            {/* MODULE FORM */}
            <form onSubmit={handleModuleSubmit} className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingModuleId ? "Update Module" : "Create New Module"}
                </h2>
                {editingModuleId && (
                  <button type="button" onClick={cancelEdit} className="text-sm text-rose-500 hover:underline mt-1">
                    Cancel Edit Mode
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                  <input required value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-cyan-200 outline-none" placeholder="Signals & Systems" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                  <textarea required value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} className="min-h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-cyan-200 outline-none" />
                </label>
              </div>

              {moduleStatus && <p className={`rounded-2xl px-4 py-3 text-sm ${moduleStatus.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{moduleStatus.message}</p>}

              <button type="submit" disabled={moduleSubmitting} className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${editingModuleId ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-900 hover:bg-slate-800"}`}>
                {moduleSubmitting ? "Saving..." : editingModuleId ? "Save Changes" : "Create Module"}
              </button>
            </form>

            {/* LESSON FORM */}
            <form onSubmit={handleLessonSubmit} className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingLessonId ? "Update Lesson" : "Create New Lesson"}
                </h2>
                {editingLessonId && (
                  <button type="button" onClick={cancelEdit} className="text-sm text-rose-500 hover:underline mt-1">
                    Cancel Edit Mode
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Target Module</span>
                  <select required value={lessonForm.module_id} onChange={(e) => setLessonForm({ ...lessonForm, module_id: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200">
                    <option value="">Select a module...</option>
                    {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Lesson Title</span>
                  <input required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Content Text</span>
                  <textarea required value={lessonForm.content_text} onChange={(e) => setLessonForm({ ...lessonForm, content_text: e.target.value })} className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Content Math (LaTeX)</span>
                  <input value={lessonForm.content_math} onChange={(e) => setLessonForm({ ...lessonForm, content_math: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Video URL</span>
                  <input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Quiz Question</span>
                  <input value={lessonForm.quiz_question} onChange={(e) => setLessonForm({ ...lessonForm, quiz_question: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Quiz Options (comma sep)</span>
                  <input value={lessonForm.quiz_options} onChange={(e) => setLessonForm({ ...lessonForm, quiz_options: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Correct Answer</span>
                  <input value={lessonForm.correct_answer} onChange={(e) => setLessonForm({ ...lessonForm, correct_answer: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>
              </div>

              {lessonStatus && <p className={`rounded-2xl px-4 py-3 text-sm ${lessonStatus.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{lessonStatus.message}</p>}

              <button type="submit" disabled={lessonSubmitting || modules.length === 0} className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${editingLessonId ? "bg-amber-500 hover:bg-amber-600" : "bg-cyan-600 hover:bg-cyan-500"}`}>
                {lessonSubmitting ? "Saving..." : editingLessonId ? "Save Changes" : "Create Lesson"}
              </button>
            </form>
          </div>
        )}

        {/* ==========================================
            TAB 2: MANAGE CATALOG
            ========================================== */}
        {activeTab === "manage" && (
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 border-b pb-4 mb-6">Manage Catalog</h2>
            
            <div className="space-y-4">
              {modules.map((mod) => (
                <div key={mod.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                  
                  {/* Module Header Row */}
                  <div className="bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{mod.title}</h3>
                      <p className="text-sm text-slate-500 truncate max-w-md">{mod.description}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => selectedManageModuleId === mod.id ? setSelectedManageModuleId(null) : fetchManageLessons(mod.id)} className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium">
                        {selectedManageModuleId === mod.id ? "Hide Lessons" : "View Lessons"}
                      </button>
                      <button onClick={() => handleEditModuleClick(mod)} className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium">Edit</button>
                      <button onClick={() => handleDeleteModule(mod.id)} className="px-3 py-1.5 text-sm bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium">Delete</button>
                    </div>
                  </div>

                  {/* Expanded Lessons Area */}
                  {selectedManageModuleId === mod.id && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      {manageLessons.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No lessons in this module.</p>
                      ) : (
                        <ul className="space-y-2">
                          {manageLessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditLessonClick(lesson)} className="text-xs font-semibold text-amber-600 hover:underline">Edit</button>
                                <span className="text-slate-300">|</span>
                                <button onClick={() => handleDeleteLesson(lesson.id, mod.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}