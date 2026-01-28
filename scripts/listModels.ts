import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables if running locally
dotenv.config();

const apiKey = process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Error: API_KEY is not set in environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // Note: The standard @google/generative-ai SDK usually does not expose listModels() directly 
    // on the client instance in some versions. This is a direct implementation of your request.
    // If this fails, it's because the SDK version doesn't support management API calls.
    
    // In many contexts, listing models requires a REST call:
    // https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
    
    console.log("Attempting to list models...");
    
    // @ts-ignore - listModels might not be in the type definition
    const models = await genAI.listModels();

    models.forEach((m: any) => {
      console.log({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods,
      });
    });
  } catch (error: any) {
    console.error("Failed to list models via SDK method.");
    console.error("Error message:", error.message);
    
    // Fallback: Try fetching via REST API if SDK method fails
    if (error.message.includes("is not a function") || error.message.includes("undefined")) {
      console.log("\nAttempting fallback via REST API...");
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
          data.models.forEach((m: any) => {
            console.log({
              name: m.name,
              displayName: m.displayName,
              supportedMethods: m.supportedGenerationMethods,
            });
          });
        } else {
            console.error("REST API response did not contain models:", data);
        }
      } catch (fetchError) {
        console.error("Fallback REST API call failed:", fetchError);
      }
    }
  }
}

listModels();
