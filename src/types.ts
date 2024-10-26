export type ModLoaderType = "fabric" | "forge" | "neoforge";

export type PluginType = "bukkit" | "bungee" | "velocity";

export interface FileInfo {
  fileName: string;
  version: string;
}
