import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { FileInfo, ModLoaderType, PluginType } from "./types";
import {
  allPluginMinecraftVersions,
  primaryMinecraftVersion,
  supportedMinecraftVersions,
} from "./version";

export async function postModToModrinth(
  project: string,
  projectId: string,
  modLoader: ModLoaderType,
  modInfo: FileInfo,
  releaseType: "release" | "beta" | "alpha",
  changelogInfo: string
) {
  const modLoaderCaptialised = {
    forge: "Forge",
    fabric: "Fabric",
    neoforge: "NeoForge",
  }[modLoader];

  await post(modInfo.fileName, {
    name: `${modInfo.version} (${modLoaderCaptialised} ${primaryMinecraftVersion})`,
    version_number: `${modInfo.version}-${modLoader}`,
    changelog: `This update brings the latest version of ${project} for Minecraft ${primaryMinecraftVersion} to Modrinth. ${changelogInfo}`,
    dependencies: [],
    game_versions: supportedMinecraftVersions,
    version_type: releaseType,
    loaders: [modLoader],
    featured: true,
    project_id: projectId,
  });
}

export async function postPluginToModrinth(
  project: string,
  projectId: string,
  pluginType: PluginType,
  fileInfo: FileInfo,
  changelogInfo: string
) {
  const pluginTypeCapitalised = {
    bukkit: "Bukkit",
    bungee: "BungeeCord",
    velocity: "Velocity",
  }[pluginType];

  const loaders = {
    bukkit: ["bukkit", "spigot", "paper"],
    bungee: ["bungeecord", "waterfall"],
    velocity: ["velocity"],
  }[pluginType];

  await post(fileInfo.fileName, {
    name: `${fileInfo.version} (${pluginTypeCapitalised})`,
    version_number: `${fileInfo.version}-${pluginType}`,
    changelog: `This update brings the latest version of ${project} to Modrinth. ${changelogInfo}`,
    dependencies: [],
    game_versions: allPluginMinecraftVersions,
    version_type: "release",
    loaders: loaders,
    featured: true,
    project_id: projectId,
  });
}

async function post(fileName: string, data: any) {
  const form = new FormData();

  form.append(
    "data",
    JSON.stringify({ ...data, file_parts: ["file"], primary_file: "file" })
  );

  const fileData = fs.readFileSync(fileName);
  form.append("file", fileData, {
    filename: fileName,
    contentType: "application/java-archive",
    knownLength: fileData.length,
  });

  try {
    // https://docs.modrinth.com/api-spec/#tag/versions/operation/createVersion
    const resp = await axios.post(`https://api.modrinth.com/v2/version`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: process.env.MODRINTH_API_TOKEN as string,
        "User-Agent": "github.com/lucko/mod-publish",
        Accept: "application/json",
      },
    });
    return resp.data;
  } catch (e: any) {
    console.error("response status: ", e.response?.status);
    console.error("response data: ", e.response?.data);
    console.error("response headers: ", e.response?.headers);
    console.error("response: ", e.toJSON());
  }
}
