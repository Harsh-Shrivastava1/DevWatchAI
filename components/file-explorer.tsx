"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Import,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload
} from "lucide-react";
import { IconButton } from "@/components/ui";
import type { WorkspaceFile } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FileExplorerProps {
  activeFileId: string | null;
  expandedPaths: Set<string>;
  files: WorkspaceFile[];
  importing: boolean;
  importProgress: number | null;
  onCreateFile: (folderPath?: string) => void;
  onCreateFolder: (folderPath?: string) => void;
  onDelete: (file: WorkspaceFile) => void;
  onDuplicate: (file: WorkspaceFile) => void;
  onExpandedPathsChange: (paths: Set<string>) => void;
  onImport: (files: File[]) => void;
  onMove: (file: WorkspaceFile, destinationFolder: string) => void;
  onOpen: (file: WorkspaceFile) => void;
  onRename: (file: WorkspaceFile) => void;
}

interface TreeNode {
  file: WorkspaceFile | null;
  name: string;
  path: string;
  type: "file" | "folder";
  children: TreeNode[];
}

interface ContextMenuState {
  x: number;
  y: number;
  file: WorkspaceFile | null;
  folderPath: string;
}

export function FileExplorer({
  activeFileId,
  expandedPaths,
  files,
  importing,
  importProgress,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onDuplicate,
  onExpandedPathsChange,
  onImport,
  onMove,
  onOpen,
  onRename
}: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const tree = useMemo(() => buildTree(files), [files]);

  useEffect(() => {
    if (!activeFileId) return;
    const active = files.find((file) => file.id === activeFileId);
    if (!active) return;
    const next = new Set(expandedPaths);
    for (const parent of allParentPaths(active.path)) next.add(parent);
    if (next.size !== expandedPaths.size) onExpandedPathsChange(next);
  }, [activeFileId, files]);

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }
    window.addEventListener("click", closeContextMenu);
    return () => window.removeEventListener("click", closeContextMenu);
  }, []);

  function handleSelected(input: HTMLInputElement | null) {
    const selected = Array.from(input?.files || []);
    if (selected.length) onImport(selected);
    if (input) input.value = "";
  }

  function openContextMenu(
    event: MouseEvent,
    file: WorkspaceFile | null,
    folderPath: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 280),
      file,
      folderPath
    });
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onContextMenu={(event) => openContextMenu(event, null, "/")}
    >
      <input
        accept={supportedAccept}
        className="hidden"
        multiple
        onChange={(event) => handleSelected(event.currentTarget)}
        ref={fileInputRef}
        type="file"
      />
      <input
        accept={supportedAccept}
        className="hidden"
        multiple
        onChange={(event) => handleSelected(event.currentTarget)}
        ref={(element) => {
          folderInputRef.current = element;
          element?.setAttribute("webkitdirectory", "");
          element?.setAttribute("directory", "");
        }}
        type="file"
      />

      <div className="flex items-center justify-between border-b border-neutral-200 p-3">
        <div>
          <p className="text-sm font-semibold text-neutral-950">Explorer</p>
          <p className="text-xs text-neutral-500">
            {importing && importProgress !== null
              ? `Importing ${importProgress}%`
              : `${files.length} stored entries`}
          </p>
        </div>
        <div className="flex gap-1">
          <IconButton label="New file" onClick={() => onCreateFile("/")}>
            <FilePlus2 size={15} />
          </IconButton>
          <IconButton label="New folder" onClick={() => onCreateFolder("/")}>
            <FolderPlus size={15} />
          </IconButton>
          <IconButton
            disabled={importing}
            label="Import files"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} />
          </IconButton>
          <IconButton
            disabled={importing}
            label="Import folder"
            onClick={() => folderInputRef.current?.click()}
          >
            <Import size={15} />
          </IconButton>
        </div>
      </div>

      {importing && importProgress !== null ? (
        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-indigo-700 transition-all"
            style={{ width: `${importProgress}%` }}
          />
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto p-2"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const source = findDraggedFile(event, files);
          if (source) onMove(source, "/");
        }}
      >
        {tree.length ? (
          tree.map((node) => (
            <TreeEntry
              activeFileId={activeFileId}
              depth={0}
              expandedPaths={expandedPaths}
              key={node.path}
              node={node}
              onContextMenu={openContextMenu}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onExpandedPathsChange={onExpandedPathsChange}
              onMove={onMove}
              onOpen={onOpen}
              onRename={onRename}
              files={files}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-950">No files yet</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Create a file or import one from your computer.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                onClick={() => onCreateFile("/")}
                type="button"
              >
                Create File
              </button>
              <button
                className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Import Files
              </button>
            </div>
          </div>
        )}
      </div>

      {contextMenu ? (
        <ContextMenu
          file={contextMenu.file}
          folderPath={contextMenu.folderPath}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onImportFiles={() => fileInputRef.current?.click()}
          onImportFolder={() => folderInputRef.current?.click()}
          onRename={onRename}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      ) : null}
    </div>
  );
}

function TreeEntry({
  activeFileId,
  depth,
  expandedPaths,
  files,
  node,
  onContextMenu,
  onDelete,
  onDuplicate,
  onExpandedPathsChange,
  onMove,
  onOpen,
  onRename
}: {
  activeFileId: string | null;
  depth: number;
  expandedPaths: Set<string>;
  files: WorkspaceFile[];
  node: TreeNode;
  onContextMenu: (event: MouseEvent, file: WorkspaceFile | null, folderPath: string) => void;
  onDelete: (file: WorkspaceFile) => void;
  onDuplicate: (file: WorkspaceFile) => void;
  onExpandedPathsChange: (paths: Set<string>) => void;
  onMove: (file: WorkspaceFile, destinationFolder: string) => void;
  onOpen: (file: WorkspaceFile) => void;
  onRename: (file: WorkspaceFile) => void;
}) {
  const expanded = expandedPaths.has(node.path);
  const active = node.file?.id === activeFileId;

  function toggle() {
    if (node.type !== "folder") {
      if (node.file) onOpen(node.file);
      return;
    }
    const next = new Set(expandedPaths);
    if (expanded) next.delete(node.path);
    else next.add(node.path);
    onExpandedPathsChange(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!node.file) return;
    if (event.key === "Enter") {
      event.preventDefault();
      toggle();
    } else if (event.key === "F2") {
      event.preventDefault();
      onRename(node.file);
    } else if (event.key === "Delete") {
      event.preventDefault();
      onDelete(node.file);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      onDuplicate(node.file);
    }
  }

  return (
    <div>
      <button
        className={cn(
          "group flex h-8 w-full items-center gap-1 rounded-md pr-1 text-left text-sm",
          active
            ? "bg-indigo-50 text-indigo-900"
            : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
        )}
        draggable={Boolean(node.file)}
        onClick={toggle}
        onContextMenu={(event) =>
          onContextMenu(event, node.file, node.type === "folder" ? node.path : parentPath(node.path))
        }
        onDragStart={(event) => {
          if (node.file) event.dataTransfer.setData("application/x-devwatch-file", node.file.id);
        }}
        onDragOver={(event) => {
          if (node.type === "folder") event.preventDefault();
        }}
        onDrop={(event) => {
          if (node.type !== "folder") return;
          event.preventDefault();
          event.stopPropagation();
          const source = findDraggedFile(event, files);
          if (source && source.id !== node.file?.id) onMove(source, node.path);
        }}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        type="button"
      >
        {node.type === "folder" ? (
          expanded ? (
            <ChevronDown className="shrink-0 text-neutral-500" size={14} />
          ) : (
            <ChevronRight className="shrink-0 text-neutral-500" size={14} />
          )
        ) : (
          <span className="w-[14px]" />
        )}
        {node.type === "folder" ? (
          expanded ? (
            <FolderOpen className="shrink-0 text-amber-600" size={16} />
          ) : (
            <Folder className="shrink-0 text-amber-600" size={16} />
          )
        ) : (
          <FileCode2 className="shrink-0 text-sky-700" size={16} />
        )}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        <MoreHorizontal
          className="shrink-0 text-neutral-400 opacity-0 group-hover:opacity-100"
          size={14}
        />
      </button>
      {node.type === "folder" && expanded
        ? node.children.map((child) => (
            <TreeEntry
              activeFileId={activeFileId}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              files={files}
              key={child.path}
              node={child}
              onContextMenu={onContextMenu}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onExpandedPathsChange={onExpandedPathsChange}
              onMove={onMove}
              onOpen={onOpen}
              onRename={onRename}
            />
          ))
        : null}
    </div>
  );
}

function ContextMenu({
  file,
  folderPath,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onDuplicate,
  onImportFiles,
  onImportFolder,
  onRename,
  x,
  y
}: {
  file: WorkspaceFile | null;
  folderPath: string;
  onCreateFile: (path?: string) => void;
  onCreateFolder: (path?: string) => void;
  onDelete: (file: WorkspaceFile) => void;
  onDuplicate: (file: WorkspaceFile) => void;
  onImportFiles: () => void;
  onImportFolder: () => void;
  onRename: (file: WorkspaceFile) => void;
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed z-50 w-52 rounded-lg border border-neutral-200 bg-white p-1"
      onClick={(event) => event.stopPropagation()}
      style={{ left: x, top: y }}
    >
      <ContextAction icon={<FilePlus2 size={15} />} label="New File" onClick={() => onCreateFile(folderPath)} />
      <ContextAction icon={<FolderPlus size={15} />} label="New Folder" onClick={() => onCreateFolder(folderPath)} />
      <ContextAction icon={<Upload size={15} />} label="Import Files" onClick={onImportFiles} />
      <ContextAction icon={<Import size={15} />} label="Import Folder" onClick={onImportFolder} />
      {file ? (
        <>
          <div className="my-1 border-t border-neutral-200" />
          <ContextAction icon={<Pencil size={15} />} label="Rename" onClick={() => onRename(file)} />
          <ContextAction icon={<Copy size={15} />} label="Duplicate" onClick={() => onDuplicate(file)} />
          <ContextAction danger icon={<Trash2 size={15} />} label="Delete" onClick={() => onDelete(file)} />
        </>
      ) : null}
    </div>
  );
}

function ContextAction({
  danger = false,
  icon,
  label,
  onClick
}: {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
        danger
          ? "text-rose-700 hover:bg-rose-50"
          : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function buildTree(files: WorkspaceFile[]) {
  const roots: TreeNode[] = [];
  const nodes = new Map<string, TreeNode>();

  function ensureFolder(folderPath: string) {
    if (folderPath === "/") return null;
    if (nodes.has(folderPath)) return nodes.get(folderPath) as TreeNode;
    const explicit = files.find((file) => file.path === folderPath && file.type === "folder") || null;
    const folder: TreeNode = {
      file: explicit,
      name: pathName(folderPath),
      path: folderPath,
      type: "folder",
      children: []
    };
    nodes.set(folderPath, folder);
    const parent = ensureFolder(parentPath(folderPath));
    if (parent) parent.children.push(folder);
    else roots.push(folder);
    return folder;
  }

  for (const file of files.filter((entry) => entry.type === "folder")) {
    ensureFolder(file.path);
  }
  for (const file of files.filter((entry) => entry.type === "file")) {
    const node: TreeNode = {
      file,
      name: file.name,
      path: file.path,
      type: "file",
      children: []
    };
    nodes.set(file.path, node);
    const parent = ensureFolder(parentPath(file.path));
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  function sortEntries(entries: TreeNode[]) {
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      const aOrder = a.file?.sortOrder || 0;
      const bOrder = b.file?.sortOrder || 0;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    });
    entries.forEach((entry) => sortEntries(entry.children));
  }
  sortEntries(roots);
  return roots;
}

function allParentPaths(value: string) {
  const segments = value.split("/").filter(Boolean);
  segments.pop();
  return segments.map((_, index) => `/${segments.slice(0, index + 1).join("/")}`);
}

function parentPath(value: string) {
  const segments = value.split("/").filter(Boolean);
  segments.pop();
  return segments.length ? `/${segments.join("/")}` : "/";
}

function pathName(value: string) {
  return value.split("/").filter(Boolean).pop() || "/";
}

function findDraggedFile(event: DragEvent, files: WorkspaceFile[]) {
  const id = event.dataTransfer.getData("application/x-devwatch-file");
  return files.find((file) => file.id === id) || null;
}

const supportedAccept = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".html",
  ".css",
  ".md",
  ".txt",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".go",
  ".rs",
  ".yaml",
  ".yml",
  ".env"
].join(",");
