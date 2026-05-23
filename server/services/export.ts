import type { Response } from "express";
import archiver from "archiver";

export type ExportFile = {
  path: string;
  content: string;
};

export function streamProjectZip(
  response: Response,
  projectName: string,
  files: ExportFile[]
) {
  response.attachment(`${projectName}.zip`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (error) => {
    throw error;
  });

  archive.pipe(response);

  for (const file of files) {
    archive.append(file.content, {
      name: file.path.replace(/^\/+/, "")
    });
  }

  archive.finalize();
}
