import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Split text into chunks for processing
 */
export const splitTextIntoChunks = (
  text: string,
  maxChunkLength = 2048
): string[] => {
  if (!text || text.length === 0) return [];
  if (text.length <= maxChunkLength) return [text];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkLength;
    if (endIndex < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", endIndex);
      if (
        paragraphBreak > startIndex &&
        paragraphBreak > startIndex + maxChunkLength / 2
      ) {
        endIndex = paragraphBreak + 2;
      } else {
        const newlineBreak = text.lastIndexOf("\n", endIndex);
        if (
          newlineBreak > startIndex &&
          newlineBreak > startIndex + maxChunkLength / 2
        ) {
          endIndex = newlineBreak + 1;
        } else {
          const sentenceBreak = Math.max(
            text.lastIndexOf(". ", endIndex),
            text.lastIndexOf("! ", endIndex),
            text.lastIndexOf("? ", endIndex)
          );
          if (
            sentenceBreak > startIndex &&
            sentenceBreak > startIndex + maxChunkLength / 2
          ) {
            endIndex = sentenceBreak + 2;
          } else {
            const spaceBreak = text.lastIndexOf(" ", endIndex);
            if (
              spaceBreak > startIndex &&
              spaceBreak > startIndex + maxChunkLength / 2
            ) {
              endIndex = spaceBreak + 1;
            }
          }
        }
      }
    }
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex;
  }

  return chunks;
};

/**
 * Average multiple embeddings into a single embedding
 */
export const averageEmbeddings = (embeddings: number[][]): number[] => {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings to average");
  }
  if (embeddings.length === 1) return embeddings[0];

  const dimension = embeddings[0].length;
  const result = new Array<number>(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      result[i] += embedding[i];
    }
  }
  for (let i = 0; i < dimension; i++) {
    result[i] /= embeddings.length;
  }
  return result;
};

/**
 * Preprocess an image for the vision model
 */
export const preprocessImage = async (
  imagePath: string
): Promise<{ data: Float32Array }> => {
  try {
    // Resize the image to 224x224 using expo-image-manipulator
    const manipResult = await ImageManipulator.manipulateAsync(
      imagePath,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    // In a real implementation, decode the image and normalize pixel values.
    // Here, we use a placeholder tensor filled with 0.5.
    const pixelData = new Float32Array(3 * 224 * 224);
    for (let c = 0; c < 3; c++) {
      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          pixelData[c * 224 * 224 + y * 224 + x] = 0.5;
        }
      }
    }

    // Remove the temporary resized image if it was saved to disk
    if (manipResult.uri && manipResult.uri.startsWith("file://")) {
      await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });
    }

    return { data: pixelData };
  } catch (error: any) {
    console.error("Error preprocessing image:", error);
    throw new Error("Failed to preprocess image: " + error.message);
  }
};
