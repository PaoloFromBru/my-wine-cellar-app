// functions/index.js

const functions = require("firebase-functions");
const {ImageAnnotatorClient} = require("@google-cloud/vision");

const visionClient = new ImageAnnotatorClient();

exports.scanWineLabel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const base64Image = data.image;
  if (!base64Image) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Image data is required.",
    );
  }

  const base64Cleaned = base64Image.split(",")[1];

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
      return {success: true, fullText: "No text detected on label."};
    }
  } catch (error) {
    console.error("Error calling Vision AI API:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to scan. Please ensure image is clear and try again.",
        error.message,
    );
  }
});
