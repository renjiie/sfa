import {
  addRxPlugin,
  createRxDatabase,
  RxCollection,
  RxDatabase,
  RxDocument,
} from "rxdb";
import { RxDBLocalDocumentsPlugin } from "rxdb/plugins/local-documents";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

// ---- Types ----

export type ItemType = "text" | "image" | "video";

export interface ItemDocType {
  id: string;
  path: string;
  type: ItemType;
  embedding: number[];
  dateAdded: string;
}

export type ItemDocument = RxDocument<ItemDocType>;
export type ItemCollection = RxCollection<ItemDocType>;

// ---- RxDB Plugins ----
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBLocalDocumentsPlugin);

// ---- Database Instance ----
let database: RxDatabase | null = null;
let itemsCollection: ItemCollection | null = null;

/**
 * Initialize the database
 */
export const initializeDatabase = async (): Promise<void> => {
  if (database) return;

  try {
    database = await createRxDatabase({
      name: "multimodal_search_db",
      storage: getRxStorageDexie(),
    });

    const itemsSchema = {
      title: "items schema",
      version: 0,
      description: "stores file embeddings for search",
      primaryKey: "id",
      type: "object",
      properties: {
        id: { type: "string", maxLength: 100 },
        path: { type: "string" },
        type: { type: "string", enum: ["text", "image", "video"] },
        embedding: { type: "array", items: { type: "number" } },
        dateAdded: { type: "string" },
      },
      required: ["id", "path", "type", "embedding"],
    };

    const collections = await database.addCollections({
      items: { schema: itemsSchema },
    });

    itemsCollection = collections.items as ItemCollection;

    console.log("Database initialized successfully");
  } catch (error: any) {
    console.error("Error initializing database:", error);
    throw new Error("Failed to initialize database: " + error.message);
  }
};

/**
 * Store an embedding in the database
 */
export const storeEmbedding = async (
  data: ItemDocType
): Promise<ItemDocType> => {
  if (!database || !itemsCollection) {
    throw new Error("Database not initialized");
  }

  try {
    const existing = await itemsCollection
      .findOne({ selector: { id: data.id } })
      .exec();

    if (existing) {
      await existing.update({
        $set: {
          embedding: data.embedding,
          dateAdded: data.dateAdded,
        },
      });
      return existing.toJSON() as ItemDocType;
    } else {
      const doc = await itemsCollection.insert(data);
      return doc.toJSON() as ItemDocType;
    }
  } catch (error: any) {
    console.error("Error storing embedding:", error);
    throw new Error("Failed to store embedding: " + error.message);
  }
};

/**
 * Perform a vector search using the given query embedding
 */
export const searchByVector = async (
  queryEmbedding: number[],
  limit: number = 20,
  threshold: number = 0.5
): Promise<(ItemDocType & { score?: number })[]> => {
  if (!database || !itemsCollection) {
    throw new Error("Database not initialized");
  }

  try {
    const results = await itemsCollection
      .find({
        selector: {
          embedding: {
            $vector: {
              $euclideanDistance: queryEmbedding,
              $maxDistance: threshold,
            },
          },
        },
        limit,
      })
      .exec();

    return results.map((doc) => {
      const data = doc.toJSON() as ItemDocType & { score?: number };
      // Calculate score (1 - normalized distance) for better UX
      const distance = (doc as any).get?.("_distance");
      data.score = typeof distance === "number" ? 1 - distance / threshold : 1;
      return data;
    });
  } catch (error: any) {
    console.error("Error searching vectors:", error);
    throw new Error("Failed to search: " + error.message);
  }
};

/**
 * Get all stored items
 */
export const getAllItems = async (): Promise<ItemDocType[]> => {
  if (!database || !itemsCollection) {
    throw new Error("Database not initialized");
  }

  try {
    const results = await itemsCollection.find().exec();
    return results.map((doc) => doc.toJSON() as ItemDocType);
  } catch (error: any) {
    console.error("Error getting all items:", error);
    throw new Error("Failed to get items: " + error.message);
  }
};

/**
 * Get the database instance
 */
export const getDatabase = (): RxDatabase | null => {
  return database;
};

/**
 * Clean up the database connection
 */
export const cleanupDatabase = async (): Promise<void> => {
  if (database) {
    await database.destroy();
    database = null;
    itemsCollection = null;
  }
};
