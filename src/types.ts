export interface Column {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  defaultValue: string;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface Entity {
  tableName: string;
  columns: Column[];
  description: string;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality: string; // '1:1' | '1:N' | 'N:M'
}

export interface NormalizationStep {
  step: string; // '1NF' | '2NF' | '3NF'
  title: string;
  description: string;
  actionsTaken: string[];
}

export interface DbSchema {
  entities: Entity[];
  relationships: Relationship[];
  normalizationSteps: NormalizationStep[];
  createSql: string;
  alterSql?: string;
  thoughtLogs?: string[];
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  dialect: "PostgreSQL" | "MySQL" | "SQLite" | "Oracle";
  normalizeLevel: "1NF" | "2NF" | "3NF";
  currentVersion: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface SchemaVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  requirements: string;
  schema: DbSchema;
  createdAt: any; // Firestore Timestamp
}
