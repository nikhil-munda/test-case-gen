import type { Request, Response } from "express";
import { getCode } from "../utilities/getCode.js";

class TestCase {
  constructor() {}
  getTestCase = async (req: Request, res: Response) => {
    try {
      const { code, problemStatement, thinkingLevel } = req.body;

      if (!code)
        return res.json({
          message: "code is missing",
        });

      if (!problemStatement)
        return res.json({
          message: "Problem Statement is missing",
        });

      let Prompt = `You are an expert competitive programming test case generator. Analyze the problem and solution carefully.

PROBLEM STATEMENT:
${problemStatement}

USER'S SOLUTION:
${code}

YOUR TASK:
1. Understand the problem constraints, input format, output format, and edge cases
2. Analyze the user's solution to identify potential bugs, edge cases, or incorrect logic
3. Generate comprehensive test cases that will expose any issues

Generate test cases in the following JSON format:

{
  "testCases": [
    {
      "input": "actual input string exactly as it should be provided to stdin",
      "expectedOutput": "correct expected output based on problem statement",
      "description": "brief description of what this test case checks (e.g., 'edge case: empty array', 'large numbers', 'negative values')"
    }
  ],
  "analysis": "brief explanation of potential issues you found in the solution or special cases to watch for"
}

REQUIREMENTS:
- Include at least 5-10 diverse test cases
- Cover edge cases: empty input, single element, maximum constraints, minimum values, negative numbers, zeros
- Include corner cases specific to this problem
- Test boundary conditions mentioned in problem statement
- Include both simple and complex test cases
- Ensure input format matches exactly what the problem expects
- Calculate correct expected outputs based on the problem statement (not the user's potentially buggy code)

IMPORTANT: 
- Return ONLY valid JSON, no markdown fences, no extra text
- Do not wrap JSON in \`\`\`json or any code blocks
- Ensure all strings are properly escaped
- If the problem involves multiple test cases in one input, format accordingly
- Base expected outputs on the PROBLEM STATEMENT, not on running the user's code`;

      let cnt = 0;
      while (cnt < 3) {
        cnt++;
        const aiResponse = await getCode(Prompt, thinkingLevel);
        if (!aiResponse || aiResponse === "") continue;

        try {
          // Clean response - remove markdown fences if present
          let cleanedResponse = aiResponse.trim();
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
          }

          // Parse JSON response
          const testCaseData = JSON.parse(cleanedResponse);

          if (testCaseData.testCases && Array.isArray(testCaseData.testCases) && testCaseData.testCases.length > 0) {
            return res.json({
              success: true,
              testCases: testCaseData.testCases,
              analysis: testCaseData.analysis || "Test cases generated successfully",
              totalTests: testCaseData.testCases.length
            });
          }
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError);
          console.error("Raw response:", aiResponse.substring(0, 500));
          continue;
        }
      }
      
      return res.json({
        success: false,
        message: "Unable to generate valid test cases. Please try again.",
      });
    } catch (error) {
      console.log(error);
      return res.json({
        error,
      });
    }
  };
}

export const getTestCase = new TestCase().getTestCase;
