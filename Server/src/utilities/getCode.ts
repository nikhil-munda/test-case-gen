import { GoogleGenerativeAI } from "@google/generative-ai";

export const getCode = async (
  prompt: string,
  thinkingLevel: String
): Promise<string> => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    async function main() {
      const time = Date.now();
      let thinkingBudget = -1;
      if (thinkingLevel === "Basic") {
        thinkingBudget = 0;
      } else if (thinkingLevel === "Advanced") {
        thinkingBudget = 1024;
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      console.log("time taken", Date.now() - time);
      return result.response.text();
    }

    return (await main()) || "";
  } catch (error) {
    console.log("error", error);
    return "";
  }
};
