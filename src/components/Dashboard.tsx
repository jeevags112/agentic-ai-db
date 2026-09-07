import React, { useState } from "react";
import { Project } from "../types";
import { 
  Database, 
  FolderPlus, 
  Trash2, 
  Clock, 
  GitBranch, 
  LogOut, 
  LineChart, 
  BarChart2, 
  Layers, 
  Users, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onTriggerCreateModal: () => void;
  userEmail: string | null;
  onSignOut: () => Promise<void>;
}

export default function Dashboard({ 
  projects, 
  onSelectProject, 
  onDeleteProject, 
  onTriggerCreateModal,
  userEmail,
  onSignOut
}: DashboardProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute neat metrics for the top bento grid
  const totalProjects = projects.length;
  const dialectCounts = projects.reduce((acc, p) => {
    acc[p.dialect] = (acc[p.dialect] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantDialect = Object.keys(dialectCounts).length > 0 
    ? Object.keys(dialectCounts).reduce((a, b) => dialectCounts[a] > dialectCounts[b] ? a : b) 
    : "None";

  const totalVersions = projects.reduce((sum, p) => sum + p.currentVersion, 0);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this schema project? This action is permanent.")) return;
    setDeletingId(id);
    try {
      await onDeleteProject(id);
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-8 relative overflow-y-auto">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Navigation / User bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight">
                Stitch Schema Agent
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Automatic Schema Design & Evolution Playground</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>User: <strong className="text-slate-300 font-medium font-mono">{userEmail || "Guest Session"}</strong></span>
            </div>
            
            <button
              onClick={onSignOut}
              className="text-xs flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Analytics Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Projects</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">{totalProjects}</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Top Dialect</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1 font-mono uppercase text-indigo-300">
                {dominantDialect}
              </h2>
            </div>
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/10">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Schema Releases</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">{totalVersions}</h2>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Greenfield / Project Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-display font-semibold text-white">Active Relational Schemas</h3>
            <p className="text-xs text-slate-500 mt-1">Manage database lifecycle, normalizations, and ALTER tracking releases.</p>
          </div>

          <button
            onClick={onTriggerCreateModal}
            className="text-xs md:text-sm flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Schema Project</span>
          </button>
        </div>

        {/* Projects Cards List Grid */}
        {projects.length === 0 ? (
          <div className="border border-dashed border-slate-800 bg-slate-900/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-950/20 text-indigo-400 border border-indigo-900/40 rounded-2xl">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-base">No Database Projects</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start by creating your first database project. You'll specify requirements and let our agent generate high-quality normalized tables.
              </p>
            </div>
            <button
              onClick={onTriggerCreateModal}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Create New Schema
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 hover:bg-slate-900/80 cursor-pointer transition-all flex flex-col justify-between group h-[200px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono font-bold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/50">
                      {proj.dialect}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      v{proj.currentVersion}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-white group-hover:text-indigo-400 transition-colors text-sm truncate">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Updated {proj.updatedAt ? new Date(proj.updatedAt.seconds * 1000).toLocaleDateString() : "just now"}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      disabled={deletingId === proj.id}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white rounded transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
