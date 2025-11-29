import { exec } from "child_process";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import Docker from "dockerode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, "temp");

// Try these socket paths (Mac uses different locations)
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// If that doesn't work, try:
// const docker = new Docker(); // Auto-detect

/**
 * Executes C++ code in a secure Docker container
 * @param code The C++ code to execute
 * @param input Optional standard input
 * @returns Promise resolving to program output
 */
export const check = async (
  code: string,
  input: string = ""
): Promise<string> => {
  await mkdir(tempDir, { recursive: true });
  const jobId = uuid();
  const cppFilePath = path.join(tempDir, `${jobId}.cpp`);
  const inputFilePath = path.join(tempDir, `${jobId}.input`);
  const containerName = `cpp-runner-${jobId}`;

  try {
    // 1. Write C++ code to temporary file
    await writeFile(cppFilePath, code);

    // 2. Write input to temporary file
    await writeFile(inputFilePath, input);

    // 3. Run C++ code in Docker container
    const result = await runInDockerContainer(
      containerName,
      cppFilePath,
      inputFilePath,
      jobId
    );

    return result;
  } catch (error: any) {
    console.error("Docker execution error:", error);
    return `Error: ${error.message}`;
  } finally {
    // 4. Cleanup temporary files and container
    await cleanup(containerName, cppFilePath, inputFilePath);
  }
};

/**
 * Runs C++ code in a Docker container with security restrictions
 */
async function runInDockerContainer(
  containerName: string,
  cppFilePath: string,
  inputFilePath: string,
  jobId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Docker command with security restrictions
    const dockerCmd = [
      "docker run",
      `--name ${containerName}`,
      "--rm",
      "--memory=128m",
      "--cpus=0.5",
      "--security-opt no-new-privileges",
      `-v "${cppFilePath}:/workspace/code.cpp:ro"`,
      `-v "${inputFilePath}:/workspace/input.txt:ro"`,
      "frolvlad/alpine-gxx:latest",
      "sh",
      "-c",
      '"cp /workspace/code.cpp /tmp/code.cpp && cp /workspace/input.txt /tmp/input.txt && cd /tmp && g++ -O2 -std=c++17 -w code.cpp -o program && chmod +x program && timeout 3s ./program < input.txt"',
    ].join(" ");

    let output = "";
    let errorOutput = "";

    // Execute Docker command with timeout
    const childProcess = exec(dockerCmd, {
      timeout: 15000, // 15 second overall timeout
      maxBuffer: 1024 * 1024, // 1MB output limit
    });

    childProcess.stdout?.on("data", (data) => {
      output += data.toString();
    });

    childProcess.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output || "No output");
      } else if (code === 124) {
        // timeout exit code
        resolve("Error: Execution timed out");
      } else {
        resolve(errorOutput || `Error: Process exited with code ${code}`);
      }
    });

    childProcess.on("error", (err) => {
      reject(new Error(`Docker execution failed: ${err.message}`));
    });
  });
}

/**
 * Cleanup temporary files and Docker container
 */
async function cleanup(
  containerName: string,
  cppFilePath: string,
  inputFilePath: string
): Promise<void> {
  // Force remove container if it still exists
  try {
    await new Promise<void>((resolve) => {
      exec(`docker rm -f ${containerName}`, () => resolve());
    });
  } catch {
    // Container might already be removed by --rm flag
  }

  // Remove temporary files
  try {
    await unlink(cppFilePath);
  } catch {}
  try {
    await unlink(inputFilePath);
  } catch {}
}
