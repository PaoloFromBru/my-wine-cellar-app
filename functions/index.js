// functions/index.js

const functions = require("firebase-functions");
const { HttpsError } = require("firebase-functions/v2/https");
const { ImageAnnotatorClient } = require("@google-cloud/vision");

const visionClient = new ImageAnnotatorClient();

exports.scanWineLabel = functions.https.onCall(
  {enforceAppCheck: false},
  async (request) => {
    console.log("Function scanWineLabel invoked (2nd Gen).");
    console.log("Authentication context (request.auth):", request.auth ? request.auth.uid : "None");

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const base64Image = request.data.image; // This is the full data URL from the client
    if (!base64Image) {
      throw new HttpsError(
        "invalid-argument",
        "Image data is required.",
      );
    }

    console.log("DEBUG: Raw base64Image received (first 100 chars):", base64Image.substring(0, 100) + "...");
    console.log("DEBUG: base64Image length:", base64Image.length);

    const splitResult = base64Image.split(",");
    const base64Cleaned = splitResult[1]; // Get the part after the comma

    console.log("DEBUG: Result of split by comma (length):", splitResult.length);
    console.log("DEBUG: Result of split by comma (part 0):", splitResult[0]);
    console.log("DEBUG: Result of split by comma (part 1 first 100 chars):", base64Cleaned ? base64Cleaned.substring(0, 100) + "..." : "undefined/empty");
    console.log("DEBUG: base64Cleaned length:", base64Cleaned ? base64Cleaned.length : "N/A");

    if (!base64Cleaned || base64Cleaned.length === 0) {
        throw new HttpsError(
            "invalid-argument",
            "Could not extract valid Base64 image data after splitting.",
        );
    }

    try {
      // FIX START: Convert the cleaned Base64 string to a Buffer
      const imageBuffer = Buffer.from(base64Cleaned, "base64");
      console.log("DEBUG: Converted image to Buffer. Buffer length:", imageBuffer.length);
      // FIX END

      const image = {
        content: imageBuffer, // Pass the Buffer instead of the string
      };

      const [result] = await visionClient.textDetection(image);
      const detections = result.textAnnotations;

      if (detections && detections.length > 0) {
        const fullText = detections[0].description;
        console.log("Detected full text:", fullText);

        return {
          success: true,
          fullText: fullText,
        };
      } else {
        console.log("No text detected.");
        return { success: true, fullText: "No text detected on label." };
      }
    } catch (error) {
      console.error("Error calling Vision AI API:", error);
      throw new HttpsError(
        "internal",
        "Failed to scan. Please ensure image is clear and try again.",
        error.message,
      );
    }
  },
);
