import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sector } from "@finapp/shared/models/financial_instrument";
import type { IAIProvider } from "../ai_provider";

export class GeminiAIProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. GeminiAIProvider will not work.");
      // We can still instantiate but methods should handle missing key
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  }

  async getSector(companyName: string): Promise<Sector | null> {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    try {
      const sectors = Object.values(Sector).filter(s => s !== Sector.Unknown && s !== Sector.Invalid).join(", ");
      const prompt = `Categorize the company '${companyName}' into one of the following sectors: [${sectors}]. Return ONLY the sector name exactly as listed. If unsure, return 'OTHER'.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toUpperCase();

      // Validate if the response is a valid Sector
      if (Object.values(Sector).includes(text as Sector)) {
        return text as Sector;
      }

      return null;
    } catch (error) {
      console.error(`Error categorizing company '${companyName}' with Gemini:`, error);
      return null;
    }
  }
}