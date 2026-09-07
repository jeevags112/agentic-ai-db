import React, { useState, useEffect, useRef } from "react";
import { Project, DbSchema, SchemaVersion } from "../types";
import ErDiagram from "./ErDiagram";
import { 
  Database, 
  Play, 
  History, 
  GitBranch, 
  Code2, 
  Columns, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronRight, 
  FileCode, 
  Loader2, 
  TrendingUp, 
  AlertCircle, 
  ArrowLeft,
  Settings,
  HelpCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

interface WorkspaceProps {
  project: Project;
  history: SchemaVersion[];
  onEvolveSchema: (requirements: string, dialect: string, normalizeLevel: string) => Promise<void>;
  onBackToDashboard: () => void;
  isLoading: boolean;
  agentLogs: string[];
}

export default function Workspace({ 
  project, 
  history, 
  onEvolveSchema, 
  onBackToDashboard,
  isLoading,
  agentLogs 
}: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "visualizer" | "sql" | "normalization" | "history">("workspace");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [copiedCreate, setCopiedCreate] = useState(false);
  const [copiedAlter, setCopiedAlter] = useState(false);
  const [dialect, setDialect] = useState<any>(project.dialect);
  const [normalizeLevel, setNormalizeLevel] = useState<any>(project.normalizeLevel);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<SchemaVersion | null>(null);

  // Auto-scroll agent logs to the bottom during execution
  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [agentLogs]);

  // Keep local state in sync when project prop changes
  useEffect(() => {
    setDialect(project.dialect);
    setNormalizeLevel(project.normalizeLevel);
  }, [project]);

  // Get current schema from history (vMax) or empty placeholder
  const latestVersion = history.find(v => v.versionNumber === project.currentVersion);
  const currentSchema: DbSchema | null = latestVersion ? latestVersion.schema : null;

  const handleCopyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementsInput.trim()) return;
    await onEvolveSchema(requirementsInput, dialect, normalizeLevel);
    setRequirementsInput(""); // Clear on success
    setActiveTab("visualizer"); // Take them to visualizer to see the output
  };

  // Populate input with a sample requirement to make the user's life easier!
  const loadSampleRequirements = () => {
    const sampleText = `Create a multi-vendor E-Commerce database.
We need to store:
1. Users (id, name, email, role, date of registration).
2. Products (sku, title, price, description, current inventory count, category).
3. Orders (invoice number, date, total amount, shipping address, order status).
4. Order Items (which orders contains which products, unit price at purchase, quantity).
5. Sellers (company name, tax id, reputation score).
6. Products are listed by a specific Seller. Every Seller can have multiple products.`;
    setRequirementsInput(sampleText);
  };

  const loadSampleEvolution = () => {
    const evolutionText = `Add an Evolution to our schema:
1. Add a Reviews table to store customer reviews for Products. Each Review has a rating (1-5), comment, and a reference to the User and Product.
2. Add a Coupon Code table (code, discount percentage, validity expiry).
3. Allow Users to apply a Coupon Code on an Order (linking order to coupon).`;
    setRequirementsInput(evolutionText);
  };

  return (
    <div id="workspace-container" className="flex-1 flex flex-col h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Workspace Header banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBackToDashboard}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="border-l border-slate-800 pl-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-indigo-950 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-900 uppercase font-mono">
                {dialect}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                v{project.currentVersion}
              </span>
            </div>
            <h1 className="text-lg font-display font-bold text-white tracking-tight mt-1">
              {project.title}
            </h1>
          </div>
        </div>

        {/* Global Settings in header */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-500 font-semibold uppercase">Dialect:</span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer font-medium font-mono"
            >
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="MySQL">MySQL</option>
              <option value="SQLite">SQLite</option>
              <option value="Oracle">Oracle</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-500 font-semibold uppercase">Normalize:</span>
            <select
              value={normalizeLevel}
              onChange={(e) => setNormalizeLevel(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer font-medium font-mono"
            >
              <option value="1NF">1NF</option>
              <option value="2NF">2NF</option>
              <option value="3NF">3NF</option>
            </select>
          </div>
        </div>
      </header>

      {/* Tabs navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 flex space-x-6 shrink-0 text-sm">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`py-3 font-medium border-b-2 transition-colors relative flex items-center space-x-2 cursor-pointer ${
            activeTab === "workspace" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Agent Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab("visualizer")}
          className={`py-3 font-medium border-b-2 transition-colors relative flex items-center space-x-2 cursor-pointer ${
            activeTab === "visualizer" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ER Visualizer</span>
          {currentSchema && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {currentSchema.entities.length} tables
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("sql")}
          className={`py-3 font-medium border-b-2 transition-colors relative flex items-center space-x-2 cursor-pointer ${
            activeTab === "sql" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Generated SQL</span>
        </button>

        <button
          onClick={() => setActiveTab("normalization")}
          className={`py-3 font-medium border-b-2 transition-colors relative flex items-center space-x-2 cursor-pointer ${
            activeTab === "normalization" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>3NF Decomposition</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 font-medium border-b-2 transition-colors relative flex items-center space-x-2 cursor-pointer ${
            activeTab === "history" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Evolution History</span>
          {history.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {history.length}
            </span>
          )}
        </button>
      </nav>

      {/* Main active layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* TAB 1: WORKSPACE & AGENT PANEL */}
        {activeTab === "workspace" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Prompt Input Panel */}
            <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-slate-800 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-display flex items-center justify-between">
                  <span>
                    {project.currentVersion === 0 ? "Initial Requirement Prompt" : "Schema Evolution Prompt"}
                  </span>
                  <div className="space-x-2">
                    {project.currentVersion === 0 ? (
                      <button 
                        type="button" 
                        onClick={loadSampleRequirements}
                        className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        Load Store Template
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={loadSampleEvolution}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Load Migration Template
                      </button>
                    )}
                  </div>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {project.currentVersion === 0 
                    ? "Input your business requirements in plain English. The agent will design a high-quality normalized schema, extract relations, and generate SQL." 
                    : "Specify the modifications, columns to add/remove, or tables to define. The Agent will analyze changes, preserve structural invariants, and compile migration ALTER scripts."}
                </p>
              </div>

              <form onSubmit={handleGenerate} className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 min-h-[200px] relative">
                  <textarea
                    value={requirementsInput}
                    onChange={(e) => setRequirementsInput(e.target.value)}
                    placeholder={
                      project.currentVersion === 0 
                        ? "e.g., We are building a ride-sharing system. Drivers have cars, passengers can book rides. We must track rides, fares, pickup locations, driver ratings..." 
                        : "e.g., We need to add billing subscriptions. Create a plan table, billing_history table, and add a plan_id field to our user table..."
                    }
                    className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 resize-none font-mono"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Mode: <strong className="text-indigo-300 uppercase">{project.currentVersion === 0 ? "Greenfield Design" : "Incremental Evolution"}</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !requirementsInput.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Agent Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{project.currentVersion === 0 ? "Design Schema" : "Evolve Schema"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Agent thought streaming Panel */}
            <div className="w-full md:w-1/2 p-6 bg-slate-950 flex flex-col overflow-hidden">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-display mb-4 flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Agent Core Process Log</span>
              </h3>

              <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-3 relative">
                {agentLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-6">
                    <Database className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
                    <p className="font-sans font-medium text-sm text-slate-500">Agent Idle</p>
                    <p className="font-sans text-xs text-slate-600 mt-1 max-w-xs">Write a requirements prompt on the left to activate the agentic designer.</p>
                  </div>
                ) : (
                  <>
                    {agentLogs.map((log, index) => {
                      const logStr = typeof log === "string" ? log : "";
                      const isSuccess = logStr.includes("Success") || logStr.includes("Successfully") || logStr.includes("Saved");
                      const isError = logStr.includes("Error") || logStr.includes("failed") || logStr.includes("Failed");
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-start space-x-2 ${
                            isSuccess ? "text-emerald-400" : isError ? "text-rose-400" : "text-slate-300"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
                          <p className="leading-relaxed whitespace-pre-wrap">{logStr}</p>
                        </div>
                      );
                    })}
                    {isLoading && (
                      <div className="flex items-center space-x-2 text-indigo-400 animate-pulse mt-4 bg-indigo-950/20 border border-indigo-900/30 p-2 rounded-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="font-semibold text-[11px] uppercase tracking-wider">Agent is actively thinking...</span>
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ER VISUALIZER */}
        {activeTab === "visualizer" && (
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            {currentSchema ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ErDiagram 
                  entities={currentSchema.entities} 
                  relationships={currentSchema.relationships} 
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600">
                <AlertCircle className="w-12 h-12 text-slate-800 mb-2" />
                <p className="font-sans font-medium text-sm text-slate-500">No Schema Available</p>
                <p className="font-sans text-xs text-slate-600 mt-1">Please use the Agent Workspace to generate a schema first.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GENERATED SQL */}
        {activeTab === "sql" && (
          <div className="flex-1 p-6 flex flex-col md:flex-row overflow-y-auto space-y-6 md:space-y-0 md:space-x-6 min-h-0">
            {currentSchema ? (
              <>
                {/* CREATE SQL PANEL */}
                <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full min-h-[350px]">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        CREATE_TABLE_{dialect.toUpperCase()}.sql
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyText(currentSchema.createSql, setCopiedCreate)}
                      className="text-xs flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                    >
                      {copiedCreate ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 bg-slate-950/40 select-all leading-relaxed whitespace-pre-wrap">
                    {currentSchema.createSql}
                  </pre>
                </div>

                {/* EVOLUTION ALTER SQL PANEL */}
                <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full min-h-[350px]">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        MIGRATION_ALTER_{dialect.toUpperCase()}.sql
                      </span>
                    </div>
                    {currentSchema.alterSql && (
                      <button
                        onClick={() => handleCopyText(currentSchema.alterSql || "", setCopiedAlter)}
                        className="text-xs flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                      >
                        {copiedAlter ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 bg-slate-950/40 leading-relaxed">
                    {currentSchema.alterSql ? (
                      <pre className="whitespace-pre-wrap select-all">{currentSchema.alterSql}</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                        <AlertCircle className="w-8 h-8 mb-2 text-slate-700" />
                        <p className="font-sans font-medium text-sm text-slate-500">No Evolution Required</p>
                        <p className="font-sans text-xs text-slate-600 mt-1 max-w-xs">
                          This is version 1 of the database. ALTER scripts are automatically generated during future evolution rounds.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600">
                <AlertCircle className="w-12 h-12 text-slate-800 mb-2" />
                <p className="font-sans font-medium text-sm text-slate-500">No SQL Available</p>
                <p className="font-sans text-xs text-slate-600 mt-1">Please use the Agent Workspace to generate a schema first.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NORMALIZATION DECOMPOSITION DETAILS */}
        {activeTab === "normalization" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {currentSchema && currentSchema.normalizationSteps ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Database Schema Normalization Flow</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    An overview of how the Gemini Agent decomposed and normalized your database requirements up to 3NF.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {currentSchema.normalizationSteps.map((stepData) => (
                    <div key={stepData.step} className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 right-0 bg-indigo-600/10 border-l border-b border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold px-3 py-1 rounded-bl">
                        {stepData.step}
                      </div>

                      <h3 className="text-sm font-display font-bold text-white mt-1 pr-12">
                        {stepData.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2 leading-relaxed flex-1">
                        {stepData.description}
                      </p>

                      <div className="mt-4 border-t border-slate-800/60 pt-4">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions Taken:</span>
                        <ul className="mt-2 space-y-1.5">
                          {stepData.actionsTaken.map((action, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                              <span className="text-indigo-400 shrink-0 mt-1">•</span>
                              <span className="leading-relaxed">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Database Theory Card */}
                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5 flex items-start space-x-3 mt-6">
                  <HelpCircle className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Normalized Schema Best Practice</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Normalization minimizes duplication of data and preserves referential integrity. 1NF guarantees atomic values. 2NF resolves partial dependencies by creating dedicated link tables. 3NF ensures no non-key columns depend transitively on the primary key, avoiding anomalies when deleting or editing.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 p-12">
                <AlertCircle className="w-12 h-12 text-slate-800 mb-2" />
                <p className="font-sans font-medium text-sm text-slate-500">No Normalization Step Records</p>
                <p className="font-sans text-xs text-slate-600 mt-1">Please use the Agent Workspace to generate a schema first.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VERSION EVOLUTION LOGS */}
        {activeTab === "history" && (
          <div className="flex-1 p-6 flex flex-col md:flex-row overflow-y-auto space-y-6 md:space-y-0 md:space-x-6 min-h-0">
            {/* Version timeline list */}
            <div className="w-full md:w-80 border-r border-slate-800 pr-6 overflow-y-auto space-y-3 flex flex-col shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Version History Tree
              </h3>
              
              {history.length === 0 ? (
                <div className="text-xs text-slate-600 italic">No versions recorded.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => setSelectedHistoryVersion(ver)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedHistoryVersion?.id === ver.id
                          ? "bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/10 text-white"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold bg-slate-950 text-indigo-400 px-1.5 py-0.5 rounded">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {ver.createdAt ? new Date(ver.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">
                          "{ver.requirements}"
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Version details view */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900/20 border border-slate-800 rounded-xl flex flex-col">
              {selectedHistoryVersion ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">
                        Schema Version {selectedHistoryVersion.versionNumber} Detailed Output
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Generated by Agent on {selectedHistoryVersion.createdAt ? new Date(selectedHistoryVersion.createdAt.seconds * 1000).toLocaleString() : "just now"}
                      </p>
                    </div>
                    <span className="text-xs bg-indigo-950 border border-indigo-900/40 text-indigo-400 px-2.5 py-1 rounded-lg font-mono">
                      Tables: {selectedHistoryVersion.schema.entities.length}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Evolution Requirement</h5>
                    <p className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800/40 p-3 rounded-lg mt-1 font-mono leading-relaxed italic">
                      "{selectedHistoryVersion.requirements}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Tables in Version {selectedHistoryVersion.versionNumber}</h5>
                      <div className="mt-2 space-y-1.5">
                        {selectedHistoryVersion.schema.entities.map((t) => (
                          <div key={t.tableName} className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-800/50 rounded-lg text-xs font-mono">
                            <span className="text-slate-300">{t.tableName}</span>
                            <span className="text-slate-500">{t.columns.length} columns</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Migration Alter SQL Script</h5>
                      <div className="mt-2">
                        {selectedHistoryVersion.schema.alterSql ? (
                          <pre className="p-3 bg-slate-950/60 border border-slate-800 text-[10px] font-mono rounded-lg overflow-auto max-h-[150px] leading-relaxed text-amber-300">
                            {selectedHistoryVersion.schema.alterSql}
                          </pre>
                        ) : (
                          <div className="p-3 bg-slate-950/30 border border-slate-800/40 rounded-lg text-slate-600 text-xs italic">
                            No migration script required (first greenfield release)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SQL Preview of that historical version */}
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Create Table SQL</h5>
                    <pre className="p-4 bg-slate-950 text-[10px] font-mono rounded-xl overflow-auto border border-slate-800 max-h-[250px] leading-relaxed text-slate-300">
                      {selectedHistoryVersion.schema.createSql}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-12">
                  <GitBranch className="w-10 h-10 mb-2 text-slate-800" />
                  <p className="font-sans font-medium text-sm text-slate-500 font-display">Comparative Version Sandbox</p>
                  <p className="font-sans text-xs text-slate-600 mt-1 max-w-xs">
                    Select a version from the timeline tree on the left to analyze requirements, tables, and historic migrations side-by-side.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
