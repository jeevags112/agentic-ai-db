import React, { useState } from "react";
import { FolderPlus, X, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, dialect: any, normalizeLevel: any) => Promise<void>;
}

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dialect, setDialect] = useState<"PostgreSQL" | "MySQL" | "SQLite" | "Oracle">("PostgreSQL");
  const [normalizeLevel, setNormalizeLevel] = useState<"1NF" | "2NF" | "3NF">("3NF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project title.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await onCreate(title, description, dialect, normalizeLevel);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to create project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="new-project-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-display font-semibold text-white">Create New Schema Project</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 text-red-300 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., E-Commerce Platform"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Description / Business Domain
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Multi-vendor store with order tracking, shopping cart, reviews, and detailed seller metrics."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Target Database Dialect
              </label>
              <select
                value={dialect}
                onChange={(e: any) => setDialect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white transition-all cursor-pointer"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLite">SQLite</option>
                <option value="Oracle">Oracle</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Normalization</span>
                <span title="3NF is recommended for transaction processing.">
                  <HelpCircle className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </label>
              <select
                value={normalizeLevel}
                onChange={(e: any) => setNormalizeLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white transition-all cursor-pointer"
              >
                <option value="1NF">1NF (Atomicity)</option>
                <option value="2NF">2NF (No Partial Dep)</option>
                <option value="3NF">3NF (No Transitive Dep)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
