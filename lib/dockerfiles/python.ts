export function generatePythonDockerfile(
  port: number,
  rootDir: string,
  runCommand: string
): string {
  const cmdArray = runCommand.split(" ");
  return `FROM python:3.11-slim

WORKDIR /app
# Install required packages
RUN pip install --no-cache-dir fastmcp>=2.0.0 uvicorn starlette
# Copy application code
COPY ${rootDir} .
# Expose port
EXPOSE ${port}
# Set environment variables
ENV MCP_TRANSPORT=sse
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=${port}
# Run the server
CMD ${JSON.stringify(cmdArray)}`;
}
