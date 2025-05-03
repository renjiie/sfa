import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
  averageEmbeddings,
  preprocessImage,
  splitTextIntoChunks,
} from "../utils/embeddingUtils";
import { getTextEmbedding, getVisionEmbedding } from "./modelService";
/**
 * Result type for embedding processing
 */
export interface EmbeddingResult {
  embedding: number[];
}

/**
 * Process a text file and generate embeddings
 * @param filePath Path to the text file
 * @returns Object containing the embedding
 */
export const processTextFile = async (
  filePath: string
): Promise<EmbeddingResult> => {
  try {
    const content: string = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const chunks: string[] = splitTextIntoChunks(content);
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      if (chunk.trim().length > 0) {
        const embedding: number[] = await getTextEmbedding(chunk);
        embeddings.push(embedding);
      }
    }
    const finalEmbedding: number[] =
      embeddings.length > 1 ? averageEmbeddings(embeddings) : embeddings[0];
    return { embedding: finalEmbedding };
  } catch (error: any) {
    console.error("Error processing text file:", error);
    throw new Error(
      `Failed to process text file: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Process an image file and generate embeddings
 * @param filePath Path to the image file
 * @returns Object containing the embedding
 */
export const processImageFile = async (
  filePath: string
): Promise<EmbeddingResult> => {
  try {
    const processedImageData: { data: Float32Array } = await preprocessImage(
      filePath
    );
    const embedding: number[] = await getVisionEmbedding(processedImageData);
    return { embedding };
  } catch (error: any) {
    console.error("Error processing image file:", error);
    throw new Error(
      `Failed to process image file: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Process a video file by extracting up to 10 frames and generate embeddings
 * @param filePath Path to the video file
 * @returns Object containing the embedding
 */
export const processVideoFile = async (
  filePath: string
): Promise<EmbeddingResult> => {
  try {
    let durationMs: number = 10000; // fallback duration (10s)
    // try {
    //   const thumb =  VideoThumbnails.getThumbnailAsync(filePath, {
    //     time: 1000,await
    //   });
    //   const duration = SourceLoadEventPayload.duration();

    //   if (thumb.duration) durationMs = thumb.duration;
    // } catch {}

    const frameCount = 10;
    const embeddings: number[][] = [];
    for (let i = 0; i < frameCount; i++) {
      const time = Math.floor((durationMs / frameCount) * i);
      try {
        const frame = await VideoThumbnails.getThumbnailAsync(filePath, {
          time,
        });
        const processedFrameData: { data: Float32Array } =
          await preprocessImage(frame.uri);
        const embedding: number[] = await getVisionEmbedding(
          processedFrameData
        );
        embeddings.push(embedding);
      } catch (err) {
        // skip frame on error
      }
    }

    if (embeddings.length === 0) {
      throw new Error("No frames could be processed from video.");
    }

    const finalEmbedding: number[] = averageEmbeddings(embeddings);
    return { embedding: finalEmbedding };
  } catch (error: any) {
    console.error("Error processing video file:", error);
    throw new Error(
      `Failed to process video file: ${error.message || "Unknown error"}`
    );
  }
};
