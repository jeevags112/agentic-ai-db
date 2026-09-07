import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  signOut,
  onAuthStateChanged,
  User
} from "./lib/firebase";
import { Project, SchemaVersion, DbSchema } from "./types";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import Workspace from "./components/Workspace";
import NewProjectModal from "./components/NewProjectModal";
import { Loader2, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Projects and History selection states
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<SchemaVersion[]>([]);
  
  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [agentIsLoading, setAgentIsLoading] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  // 1. Firebase Authentication Listener & Local Sandbox check
  useEffect(() => {
    const savedLocalUser = localStorage.getItem("local_user");
    if (savedLocalUser) {
      try {
        setCurrentUser(JSON.parse(savedLocalUser));
        setAuthLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("local_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!localStorage.getItem("local_user")) {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Projects listener (User specific, sorted client-side to ensure index safety)
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isLocalSandbox) {
      const localProjStr = localStorage.getItem("local_projects") || "[]";
      try {
        const parsed: Project[] = JSON.parse(localProjStr);
        setProjects(parsed);
      } catch (e) {
        console.error("Failed to parse local projects:", e);
        setProjects([]);
      }
      return;
    }

    const q = query(
      collection(db, "projects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projList: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        projList.push({
          id: docSnap.id,
          ...data
        } as Project);
      });

      // Sort client-side by updatedAt desc to avoid missing index errors on start
      projList.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
      });

      setProjects(projList);
    }, (error) => {
      console.error("Firestore projects listener error:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // 3. Real-time Schema versions listener for active project
  useEffect(() => {
    if (!selectedProjectId) {
      setHistory([]);
      return;
    }

    if (currentUser?.isLocalSandbox) {
      const localVersionsStr = localStorage.getItem("local_versions") || "[]";
      try {
        const allVersions: SchemaVersion[] = JSON.parse(localVersionsStr);
        const projVersions = allVersions.filter(v => v.projectId === selectedProjectId);
        projVersions.sort((a, b) => b.versionNumber - a.versionNumber);
        setHistory(projVersions);
      } catch (e) {
        console.error("Failed to parse local versions:", e);
        setHistory([]);
      }
      return;
    }

    const q = query(
      collection(db, "schemaVersions"),
      where("projectId", "==", selectedProjectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const verList: SchemaVersion[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        verList.push({
          id: docSnap.id,
          ...data
        } as SchemaVersion);
      });

      // Sort client-side by versionNumber desc
      verList.sort((a, b) => b.versionNumber - a.versionNumber);
      setHistory(verList);
    }, (error) => {
      console.error("Firestore versions listener error:", error);
    });

    return unsubscribe;
  }, [selectedProjectId, currentUser]);

  // Handle Log out
  const handleSignOut = async () => {
    if (currentUser?.isLocalSandbox) {
      localStorage.removeItem("local_user");
      setCurrentUser(null);
      setProjects([]);
      setSelectedProjectId(null);
      setHistory([]);
    } else {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  // Handle Project Creation
  const handleCreateProject = async (
    title: string, 
    description: string, 
    dialect: "PostgreSQL" | "MySQL" | "SQLite" | "Oracle", 
    normalizeLevel: "1NF" | "2NF" | "3NF"
  ) => {
    if (!currentUser) return;
    
    if (currentUser.isLocalSandbox) {
      const newProj: Project = {
        id: "local_proj_" + Date.now(),
        userId: currentUser.uid,
        title,
        description,
        dialect,
        normalizeLevel,
        currentVersion: 0,
        createdAt: { seconds: Math.floor(Date.now() / 1000) } as any,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) } as any
      };
      const updated = [newProj, ...projects];
      setProjects(updated);
      localStorage.setItem("local_projects", JSON.stringify(updated));
      return;
    }

    await addDoc(collection(db, "projects"), {
      userId: currentUser.uid,
      title,
      description,
      dialect,
      normalizeLevel,
      currentVersion: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  // Handle Project Deletion (cleans up project & corresponding versions)
  const handleDeleteProject = async (projectId: string) => {
    if (currentUser?.isLocalSandbox) {
      const updated = projects.filter(p => p.id !== projectId);
      setProjects(updated);
      localStorage.setItem("local_projects", JSON.stringify(updated));

      const localVersionsStr = localStorage.getItem("local_versions") || "[]";
      try {
        const allVersions: SchemaVersion[] = JSON.parse(localVersionsStr);
        const remainingVersions = allVersions.filter(v => v.projectId !== projectId);
        localStorage.setItem("local_versions", JSON.stringify(remainingVersions));
      } catch (e) {
        console.error("Failed to update local versions on deletion:", e);
      }

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      return;
    }

    // 1. Delete project doc
    await deleteDoc(doc(db, "projects", projectId));

    // 2. Query and delete corresponding schemaVersions docs
    const q = query(collection(db, "schemaVersions"), where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "schemaVersions", docSnap.id));
    });

    // Reset selected project if we deleted it
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  // Trigger Gemini AI generation & Evolution
  const handleEvolveSchema = async (requirements: string, targetDialect: string, targetNormalize: string) => {
    if (!currentUser || !selectedProjectId) return;

    const activeProject = projects.find(p => p.id === selectedProjectId);
    if (!activeProject) return;

    setAgentIsLoading(true);
    setAgentLogs([]);

    // Progress logger simulation while waiting for server response
    const logSteps = [
      "Spinning up Gemini Schema Design Agent...",
      "Analyzing user-provided system instructions and dialect constraints...",
      "Extracting physical entities, business invariants, and logical domains...",
      "Identifying keys, foreign constraint rules, and relationship cardinality...",
      "Evaluating normalization dependencies (No Partial/Transitive anomalies)...",
      "Structuring target database tables inside isolated schema layout...",
      "Formatting syntax definitions and standard primary indexing...",
      "Drafting idiomatic DDL CREATE TABLE statements for " + targetDialect + "...",
    ];

    let stepIndex = 0;
    const logInterval = setInterval(() => {
      if (stepIndex < logSteps.length) {
        setAgentLogs(prev => [...prev, logSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 1800);

    try {
      // Fetch latest schema version to pass as the base for schema evolution
      const latestVer = history[0]; // because history is sorted desc
      const currentSchema = latestVer ? latestVer.schema : null;

      // Make secure full-stack API call
      const response = await fetch("/api/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements,
          currentSchema,
          dialect: targetDialect,
          normalizeLevel: targetNormalize
        })
      });

      clearInterval(logInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation endpoint failed.");
      }

      const generatedData: DbSchema = await response.json();

      // Show real logs from the agent response
      if (generatedData.thoughtLogs && generatedData.thoughtLogs.length > 0) {
        setAgentLogs(prev => [...prev, ...generatedData.thoughtLogs!]);
      }

      setAgentLogs(prev => [...prev, "✓ Server compilation completed successfully. Updating local database..."]);

      // Save a new version increment
      const nextVersionNumber = activeProject.currentVersion + 1;

      if (currentUser.isLocalSandbox) {
        const newVersion: SchemaVersion = {
          id: "local_ver_" + Date.now(),
          projectId: selectedProjectId,
          versionNumber: nextVersionNumber,
          requirements,
          schema: {
            entities: generatedData.entities,
            relationships: generatedData.relationships,
            normalizationSteps: generatedData.normalizationSteps,
            createSql: generatedData.createSql,
            alterSql: generatedData.alterSql || ""
          },
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any
        };

        const localVersionsStr = localStorage.getItem("local_versions") || "[]";
        let allVersions: SchemaVersion[] = [];
        try {
          allVersions = JSON.parse(localVersionsStr);
        } catch (e) {
          allVersions = [];
        }
        allVersions.push(newVersion);
        localStorage.setItem("local_versions", JSON.stringify(allVersions));

        // Update local projects
        const updatedProjects = projects.map(p => {
          if (p.id === selectedProjectId) {
            return {
              ...p,
              currentVersion: nextVersionNumber,
              dialect: targetDialect as any,
              normalizeLevel: targetNormalize as any,
              updatedAt: { seconds: Math.floor(Date.now() / 1000) } as any
            };
          }
          return p;
        });
        setProjects(updatedProjects);
        localStorage.setItem("local_projects", JSON.stringify(updatedProjects));

        // Update current history right away
        const projVersions = allVersions.filter(v => v.projectId === selectedProjectId);
        projVersions.sort((a, b) => b.versionNumber - a.versionNumber);
        setHistory(projVersions);
      } else {
        await addDoc(collection(db, "schemaVersions"), {
          projectId: selectedProjectId,
          versionNumber: nextVersionNumber,
          requirements,
          schema: {
            entities: generatedData.entities,
            relationships: generatedData.relationships,
            normalizationSteps: generatedData.normalizationSteps,
            createSql: generatedData.createSql,
            alterSql: generatedData.alterSql || ""
          },
          createdAt: serverTimestamp()
        });

        // Update project core document
        await updateDoc(doc(db, "projects", selectedProjectId), {
          currentVersion: nextVersionNumber,
          dialect: targetDialect,
          normalizeLevel: targetNormalize,
          updatedAt: serverTimestamp()
        });
      }

      setAgentLogs(prev => [
        ...prev, 
        `★ Success! Database Schema updated successfully to Release Version v${nextVersionNumber}!`,
        "✓ ER Connection maps updated.",
        "✓ Complete relational tables configured."
      ]);

    } catch (err: any) {
      clearInterval(logInterval);
      console.error(err);
      setAgentLogs(prev => [
        ...prev, 
        `❌ Design Agent Error: ${err.message}`, 
        "ℹ Suggestion: Please refine your requirements prompt and check API connectivity."
      ]);
    } finally {
      setAgentIsLoading(false);
    }
  };

  const handleLocalSignIn = () => {
    const localUser = {
      uid: "local-sandbox-user",
      email: "local-sandbox@example.com",
      isLocalSandbox: true
    };
    setCurrentUser(localUser);
    localStorage.setItem("local_user", JSON.stringify(localUser));
  };

  // Find currently active project
  const activeProject = projects.find(p => p.id === selectedProjectId);

  if (authLoading) {
    return (
      <div id="loader-screen" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-semibold tracking-wide uppercase">Securing Workspace...</span>
      </div>
    );
  }

  return (
    <div id="app-viewport" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div 
            key="auth" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <AuthScreen onLocalSignIn={handleLocalSignIn} />
          </motion.div>
        ) : !activeProject ? (
          <motion.div 
            key="dashboard" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Dashboard
              projects={projects}
              onSelectProject={setSelectedProjectId}
              onDeleteProject={handleDeleteProject}
              onTriggerCreateModal={() => setShowCreateModal(true)}
              userEmail={currentUser.email}
              onSignOut={handleSignOut}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="workspace" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="w-full flex flex-col h-screen"
          >
            <Workspace
              project={activeProject}
              history={history}
              onEvolveSchema={handleEvolveSchema}
              onBackToDashboard={() => setSelectedProjectId(null)}
              isLoading={agentIsLoading}
              agentLogs={agentLogs}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Project Creator Overlay Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <NewProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
