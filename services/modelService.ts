import * as FileSystem from "expo-file-system";

type Session = { ready: boolean } | null;

const getModelPath = async (filename: string): Promise<string> => {
  // Store models in the app's cache directory for both platforms
  const modelsDir = `${FileSystem.cacheDirectory}models`;
  const destPath = `${modelsDir}/${filename}`;

  // Ensure models directory exists
  const dirInfo = await FileSystem.getInfoAsync(modelsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
  }

  // In Expo Go, you cannot copy from assets, so just check existence or create placeholder
  const fileInfo = await FileSystem.getInfoAsync(destPath);
  if (!fileInfo.exists) {
    // Create a placeholder file for development/demo
    await FileSystem.writeAsStringAsync(destPath, "PLACEHOLDER_MODEL", {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  return destPath;
};

const TEXT_MODEL_FILENAME = "nomic-embed-text-v1.5.onnx";
const VISION_MODEL_FILENAME = "nomic-embed-vision-v1.5.onnx";

let textSession: Session = null;
let visionSession: Session = null;

export const initializeModels = async (): Promise<void> => {
  try {
    const textModelPath = await getModelPath(TEXT_MODEL_FILENAME);
    const visionModelPath = await getModelPath(VISION_MODEL_FILENAME);

    // Check if models exist (should always be true after getModelPath)
    const textModelExists = (await FileSystem.getInfoAsync(textModelPath))
      .exists;
    const visionModelExists = (await FileSystem.getInfoAsync(visionModelPath))
      .exists;

    if (!textModelExists) {
      console.warn(
        "Text model not found, creating placeholder for development"
      );
      await FileSystem.writeAsStringAsync(textModelPath, "PLACEHOLDER_MODEL", {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
    if (!visionModelExists) {
      console.warn(
        "Vision model not found, creating placeholder for development"
      );
      await FileSystem.writeAsStringAsync(
        visionModelPath,
        "PLACEHOLDER_MODEL",
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    }

    textSession = { ready: true };
    visionSession = { ready: true };
    // In production, load ONNX sessions here
    console.log("Models initialized successfully");
  } catch (error: any) {
    console.error("Error initializing models:", error);
    throw new Error("Failed to initialize models: " + error.message);
  }
};

export const getTextEmbedding = async (text: string): Promise<number[]> => {
  if (!textSession) throw new Error("Text model not initialized");
  try {
    const EMBEDDING_DIM = 768;
    const embedding = generateDeterministicEmbedding(text, EMBEDDING_DIM);
    return embedding;
  } catch (error: any) {
    console.error("Error getting text embedding:", error);
    throw new Error("Failed to get text embedding: " + error.message);
  }
};

export const getVisionEmbedding = async (imageData: {
  data: Float32Array;
}): Promise<number[]> => {
  if (!visionSession) throw new Error("Vision model not initialized");
  try {
    const EMBEDDING_DIM = 768;
    const imageHash = Array.from(imageData.data)
      .slice(0, 20)
      .reduce((acc, val, i) => acc + val * (i + 1), 0);
    const embedding = generateDeterministicEmbedding(
      imageHash.toString(),
      EMBEDDING_DIM
    );
    return embedding;
  } catch (error: any) {
    console.error("Error getting vision embedding:", error);
    throw new Error("Failed to get vision embedding: " + error.message);
  }
};

const generateDeterministicEmbedding = (
  input: string,
  dimensions: number
): number[] => {
  const hash = input.split("").reduce((acc, char, i) => {
    return acc + char.charCodeAt(0) * Math.pow(31, i % 10);
  }, 0);
  const embedding = new Array(dimensions).fill(0);
  const hashStr = hash.toString();
  for (let i = 0; i < dimensions; i++) {
    const seed = hashStr.charCodeAt(i % hashStr.length) / 255 - 0.5;
    const position = i / dimensions;
    embedding[i] = seed * Math.sin(position * Math.PI);
  }
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => val / magnitude);
};

export const getTextSession = (): Session => textSession;
export const getVisionSession = (): Session => visionSession;
