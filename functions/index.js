// functions/index.js

const functions = require("firebase-functions");
const { HttpsError } = require("firebase-functions/v2/https"); // HttpsError is now directly imported
const { ImageAnnotatorClient } = require("@google-cloud/vision");

const visionClient = new ImageAnnotatorClient();

// FIX: Explicitly set enforceAppCheck: false to bypass App Check verification for now
//      This is a 2nd Gen Cloud Function definition.
exports.scanWineLabel = functions.https.onCall(
  {enforceAppCheck: false},
  async (request) => {
    // Log to console for debugging purposes, will appear in Cloud Functions logs
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

    // --- NEW DEBUG LOGS FOR IMAGE PROCESSING ---
    console.log("DEBUG: Raw base64Image received (first 50 chars):", base64Image.substring(0, 50) + "...");
    console.log("DEBUG: base64Image length:", base64Image.length);

    const splitResult = base64Image.split(",");
    console.log("DEBUG: Result of split by comma:", splitResult);

    const base64Cleaned = splitResult[1]; // Get the part after the comma
    console.log("DEBUG: base64Cleaned (first 50 chars):", base64Cleaned ? base64Cleaned.substring(0, 50) + "..." : "undefined/empty");
    console.log("DEBUG: base64Cleaned length:", base64Cleaned ? base64Cleaned.length : "N/A");
    // --- END NEW DEBUG LOGS ---

    // Ensure base64Cleaned is valid before proceeding
    if (!base64Cleaned) {
        throw new HttpsError(
            "invalid-argument",
            "Could not extract valid Base64 image data after splitting.",
        );
    }

    try {
      const image = {
        content: base64Cleaned,
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
