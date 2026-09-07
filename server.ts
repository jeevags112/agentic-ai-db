import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Serve Firebase Client Config dynamically
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      res.json(configData);
    } else {
      res.status(404).json({ error: "Firebase applet config not found." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read Firebase config", details: error.message });
  }
});

// API: Agentic Schema Design & Evolution
app.post("/api/generate-schema", async (req, res) => {
  const { requirements, currentSchema, dialect, normalizeLevel = "3NF" } = req.body;

  if (!requirements) {
    return res.status(400).json({ error: "Requirements are required" });
  }

  try {
    const ai = getGeminiClient();
    const isEvolution = !!currentSchema;

    const systemInstruction = `You are a Senior Principal Database Architect and Agentic Schema Designer.
Your objective is to analyze requirements, perform professional schema design, decompose the tables up to 3NF, output the complete relational schema, generate production-ready SQL statements for the target SQL dialect, and (if a current schema is provided) perform evolution mapping to generate migration ALTER TABLE statements.

Target SQL Dialect: ${dialect || "PostgreSQL"}
Normalization Target: ${normalizeLevel}

RULES:
1. Normalize correctly up to 3NF: No repeating groups (1NF), all non-key attributes fully functionally dependent on the primary key (2NF), and no transitive dependencies (3NF).
2. Generate highly readable and idiomatic SQL syntax with clear comments.
3. If currentSchema is provided, compare the entities and columns and generate precise ALTER TABLE statements (adding/removing columns, adding tables, modifying foreign keys) to safely transition from the current schema to the new schema.
4. Output must strictly conform to the provided JSON Schema. Do not include markdown codeblocks (like \`\`\`json) in the JSON response output.`;

    const userPrompt = isEvolution
      ? `=== CURRENT DATABASE SCHEMA ===
${JSON.stringify(currentSchema, null, 2)}

=== EVOLUTION REQUIREMENTS ===
${requirements}

Analyze the changes. Generate the new complete schema, detail the step-by-step normalization logic, compile the full CREATE SQL for the entire new schema, and generate the ALTER SQL migrations to transition from the current schema to the new schema.`
      : `=== SCHEMA REQUIREMENTS ===
${requirements}

Analyze the requirements. Create a new database schema normalized up to ${normalizeLevel}. Detail the step-by-step normalization process, and generate the full CREATE TABLE SQL scripts.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["entities", "relationships", "normalizationSteps", "createSql", "alterSql", "thoughtLogs"],
          properties: {
            entities: {
              type: Type.ARRAY,
              description: "The tables of the database.",
              items: {
                type: Type.OBJECT,
                required: ["tableName", "columns", "description"],
                properties: {
                  tableName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  columns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["name", "dataType", "isPrimaryKey", "isForeignKey", "isNullable", "defaultValue"],
                      properties: {
                        name: { type: Type.STRING },
                        dataType: { type: Type.STRING },
                        isPrimaryKey: { type: Type.BOOLEAN },
                        isForeignKey: { type: Type.BOOLEAN },
                        isNullable: { type: Type.BOOLEAN },
                        defaultValue: { type: Type.STRING },
                        referencesTable: { type: Type.STRING },
                        referencesColumn: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
            relationships: {
              type: Type.ARRAY,
              description: "Foreign key constraints and references.",
              items: {
                type: Type.OBJECT,
                required: ["fromTable", "fromColumn", "toTable", "toColumn", "cardinality"],
                properties: {
                  fromTable: { type: Type.STRING },
                  fromColumn: { type: Type.STRING },
                  toTable: { type: Type.STRING },
                  toColumn: { type: Type.STRING },
                  cardinality: { 
                    type: Type.STRING,
                    description: "For example: '1:1', '1:N', 'N:M'"
                  },
                },
              },
            },
            normalizationSteps: {
              type: Type.ARRAY,
              description: "Detailing how the schema achieved 1NF, 2NF, and 3NF compliance.",
              items: {
                type: Type.OBJECT,
                required: ["step", "title", "description", "actionsTaken"],
                properties: {
                  step: { type: Type.STRING, description: "e.g. '1NF', '2NF', '3NF'" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionsTaken: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            createSql: { 
              type: Type.STRING, 
              description: "The complete CREATE TABLE script matching the designed schema." 
            },
            alterSql: { 
              type: Type.STRING, 
              description: "If an existing schema was provided, the ALTER statements mapping the upgrade paths. Otherwise leave blank." 
            },
            thoughtLogs: {
              type: Type.ARRAY,
              description: "A chronological list of the agent's detailed thoughts during the schema design phase.",
              items: { type: Type.STRING }
            }
          },
        },
      },
    });

    const schemaText = response.text;
    if (!schemaText) {
      throw new Error("No schema returned from Gemini API");
    }

    const schemaJson = JSON.parse(schemaText);
    res.json(schemaJson);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Gemini API call failed", details: error.message });
  }
});

// Serve frontend assets in production or integrate Vite in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
