import { searchByVector } from "./databaseService";
import type { FileObject } from "./fileService";
import { getTextEmbedding } from "./modelService";

/**
 * Type for a search result item.
 */
export interface SearchResult extends FileObject {
  id: string;
  path: string;
  type: "text" | "image" | "video";
  embedding: number[];
  dateAdded: string;
  score?: number;
}

/**
 * Search files using a text query
 * @param query The search query
 * @param limit Maximum number of results to return
 * @returns Array of search results
 */
export const searchFiles = async (
  query: string,
  limit: number = 20
): Promise<SearchResult[]> => {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await getTextEmbedding(query);

    // Search using the embedding
    const results = await searchByVector(queryEmbedding, limit);

    return results as SearchResult[];
  } catch (error: any) {
    console.error("Error searching files:", error);
    throw new Error("Failed to search files: " + error.message);
  }
};
