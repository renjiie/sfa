import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import path from "path-browserify";
import { Platform } from "react-native";
/**
 * Get file extension from filename
 * @param filename The filename
 * @returns The file extension including dot
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename);
};

/**
 * Get MIME type based on file extension
 * @param filename The filename
 * @returns The MIME type or null if unknown
 */
export const getMimeType = (filename: string): string | null => {
  const ext = getFileExtension(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".rtf": "text/rtf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
  };

  return mimeTypes[ext] || null;
};

export interface FileInfo {
  name: string;
  path: string;
  size?: number;
  lastModified?: Date | string | number;
  preview?: string;
  duration?: string;
  thumbnail?: string;
  error?: string;
}

/**
 * Get information about a file
 * @param filePath Path to the file
 * @returns File information
 */
export const getFileInfo = async (filePath: string): Promise<FileInfo> => {
  try {
    // Get file stats
    const fileStats = await FileSystem.getInfoAsync(filePath);

    // Check if file exists
    if (!fileStats.exists) {
      throw new Error("File does not exist");
    }

    // Get file name
    const fileName = path.basename(filePath);
    const fileExt = getFileExtension(fileName).toLowerCase();

    // Base info
    const info: FileInfo = {
      name: fileName,
      path: filePath,
      size: fileStats.size,
      lastModified: fileStats.modificationTime,
    };

    // Add type-specific info
    if ([".txt", ".md", ".rtf"].includes(fileExt)) {
      // For text files, add preview
      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      info.preview =
        content.substring(0, 300) + (content.length > 300 ? "..." : "");
    } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExt)) {
      // For images, no additional info needed
    } else if ([".mp4", ".mov", ".avi", ".mkv"].includes(fileExt)) {
      // For videos, get duration and thumbnail
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(filePath, {
          time: 1000,
        });
        // if (duration) {
        //   info.duration = formatDuration(duration / 1000); // duration in ms
        // }
        info.thumbnail = uri;
      } catch (mediaError) {
        console.error("Error getting media info:", mediaError);
      }
    }

    return info;
  } catch (error) {
    console.error("Error getting file info:", error);
    return {
      name: path.basename(filePath),
      path: filePath,
      error: "Could not read file information",
    };
  }
};

/**
 * Format duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Generate a unique filename in the temporary directory
 * @param prefix Prefix for the filename
 * @param extension File extension (with dot)
 * @returns Full path to the unique filename
 */
export const getUniqueFilename = (
  prefix: string,
  extension: string
): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  const tempDir =
    Platform.OS === "ios"
      ? FileSystem.cacheDirectory // Expo FileSystem uses cacheDirectory for temp files
      : FileSystem.cacheDirectory;

  return `${tempDir}/${prefix}_${timestamp}_${random}${extension}`;
};
