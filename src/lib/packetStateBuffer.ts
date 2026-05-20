import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ComplianceResult } from "@/types/compliance";
import type { TaskStatus } from "@/services/packetAnalysisService";

const DB_NAME = "packet-review-db";
const DB_VERSION = 1;
const STORE_NAME = "analysisTasks";

export interface AnalysisTaskState {
  taskId: string;
  status: TaskStatus;
  progress: number;
  result?: ComplianceResult;
  error?: string;
  fileName: string;
  textLength: number;
  createdAt: number;
  updatedAt: number;
}

interface PacketReviewDB extends DBSchema {
  analysisTasks: {
    key: string;
    value: AnalysisTaskState;
    indexes: {
      "by-status": TaskStatus;
      "by-updated": number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PacketReviewDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PacketReviewDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PacketReviewDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "taskId" });
          store.createIndex("by-status", "status");
          store.createIndex("by-updated", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTaskState(task: AnalysisTaskState): Promise<void> {
  const db = await getDB();
  const updatedTask = {
    ...task,
    updatedAt: Date.now(),
  };
  await db.put(STORE_NAME, updatedTask);
}

export async function getTaskState(taskId: string): Promise<AnalysisTaskState | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, taskId);
}

export async function getAllTasks(): Promise<AnalysisTaskState[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteTaskState(taskId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, taskId);
}

export async function clearAllTasks(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getIncompleteTasks(): Promise<AnalysisTaskState[]> {
  const db = await getDB();
  const allTasks = await db.getAll(STORE_NAME);
  return allTasks.filter((task) => task.status === "pending" || task.status === "processing");
}
