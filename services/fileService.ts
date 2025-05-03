import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { getFileExtension, getMimeType } from "../utils/fileUtils";
import { storeEmbedding } from "./databaseService";
import {
  processImageFile,
  processTextFile,
  processVideoFile,
} from "./embeddingService";

// Type definitions
export interface FileObject {
  uri: string;
  type: string | null;
  name: string;
  size?: number;
}

export interface ProcessResult {
  file: FileObject;
  success?: boolean;
  error?: string;
}

/**
 * Main function to process a file based on its type
 * @param {FileObject} file File object from document picker or scan
 * @returns {Promise<boolean>} True if processed and stored successfully
 */
export const processFile = async (file: FileObject): Promise<boolean> => {
  try {
    // Get file path based on platform
    const filePath =
      Platform.OS === "ios"
        ? decodeURIComponent(file.uri.replace("file://", ""))
        : file.uri;

    // Determine file type
    const fileType = determineFileType(file);
    if (!fileType) {
      throw new Error(`Unsupported file type: ${file.type || file.name}`);
    }

    // Process file based on type
    let processedData: { embedding: number[] };
    switch (fileType) {
      case "text":
        processedData = await processTextFile(filePath);
        break;
      case "image":
        processedData = await processImageFile(filePath);
        break;
      case "video":
        processedData = await processVideoFile(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Store embedding in database
    await storeEmbedding({
      id: generateId(filePath),
      path: filePath,
      type: fileType,
      embedding: processedData.embedding,
      dateAdded: new Date().toISOString(),
    });

    return true;
  } catch (error: any) {
    console.error("Error processing file:", error);
    throw error;
  }
};

/**
 * Recursively scan a folder for files using Expo FileSystem
 * @param {string} folderPath Path to the folder to scan
 * @param {(count: number) => void} [progressCallback] Function to call with file count updates
 * @returns {Promise<FileObject[]>} Array of file objects
 */
export const scanFolderForFiles = async (
  folderPath: string,
  progressCallback?: (count: number) => void
): Promise<FileObject[]> => {
  let fileCount = 0;
  const supportedFiles: FileObject[] = [];

  // Function to recursively process folders
  const processFolder = async (path: string) => {
    try {
      const items = await FileSystem.readDirectoryAsync(path);

      for (const itemName of items) {
        const itemPath = path.endsWith("/")
          ? path + itemName
          : path + "/" + itemName;
        const info = await FileSystem.getInfoAsync(itemPath);

        if (info.isDirectory) {
          // Recursively scan subdirectories
          await processFolder(itemPath);
        } else if (info.exists) {
          // Check if this is a supported file type
          const extension = getFileExtension(itemName).toLowerCase();
          const mimeType = getMimeType(itemName);

          // Create a file object similar to what document picker would return
          const fileObj: FileObject = {
            uri: Platform.OS === "ios" ? `file://${itemPath}` : itemPath,
            type: mimeType,
            name: itemName,
            size: info.size,
          };

          if (determineFileType(fileObj)) {
            supportedFiles.push(fileObj);
            fileCount++;

            // Call progress callback if provided
            if (progressCallback && fileCount % 10 === 0) {
              progressCallback(fileCount);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${path}:`, error);
      // Continue with other directories instead of failing completely
    }
  };

  await processFolder(folderPath);

  // Final progress update
  if (progressCallback) {
    progressCallback(fileCount);
  }

  return supportedFiles;
};

/**
 * Process multiple files from a folder
 * @param {FileObject[]} files Array of file objects
 * @param {(current: number, total: number) => void} [progressCallback] Function to call with progress updates
 * @returns {Promise<ProcessResult[]>} Array of processing results
 */
export const processFolderFiles = async (
  files: FileObject[],
  progressCallback?: (current: number, total: number) => void
): Promise<ProcessResult[]> => {
  const results: ProcessResult[] = [];
  let processedCount = 0;

  for (const file of files) {
    try {
      const success = await processFile(file);
      results.push({
        file,
        success,
      });
    } catch (error: any) {
      console.error(`Error processing file ${file.name}:`, error);
      results.push({
        file,
        error: error.message,
      });
    }

    processedCount++;
    if (progressCallback) {
      progressCallback(processedCount, files.length);
    }
  }

  return results;
};

/**
 * Determine file type based on mime type or extension
 * @param {FileObject} file File object from document picker or file scan
 * @returns {'text' | 'image' | 'video' | null} File type or null if unsupported
 */
const determineFileType = (
  file: FileObject
): "text" | "image" | "video" | null => {
  // Try to get mime type
  const mimeType = file.type || getMimeType(file.name);
  if (mimeType) {
    if (mimeType.startsWith("text/")) return "text";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
  }

  // Fallback to extension
  const extension = getFileExtension(file.name).toLowerCase();
  if ([".txt", ".md", ".rtf"].includes(extension)) return "text";
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension))
    return "image";
  if ([".mp4", ".mov", ".avi", ".mkv"].includes(extension)) return "video";

  return null;
};

/**
 * Generate a unique ID for the file
 * @param {string} filePath Full path to the file
 * @returns {string} Unique ID
 */
const generateId = (filePath: string): string => {
  // Create a hash from the file path and current timestamp
  return (
    filePath.replace(/[^a-zA-Z0-9]/g, "") +
    "_" +
    new Date().getTime().toString()
  );
};
