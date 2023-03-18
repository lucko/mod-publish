import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { FileInfo, ModLoaderType } from "./types";

const primaryMinecraftVersion = "1.19.4";
const supportedMinecraftVersions = ["1.19", "1.19.1", "1.19.2", '1.19.3', '1.19.4'];

export async function postToModrinth(
  project: string,
  projectId: string,
  modLoader: ModLoaderType,
  modInfo: FileInfo,
  releaseType: "release" | "beta" | "alpha",
  changelogInfo: string
) {
  const form = new FormData();

  const modLoaderCaptialised =
    modLoader.charAt(0).toUpperCase() + modLoader.slice(1);

  form.append(
    "data",
    JSON.stringify({
      name: `${modInfo.version} (${modLoaderCaptialised} ${primaryMinecraftVersion})`,
      version_number: `${modInfo.version}-${modLoader}`,
      changelog:
        "This update brings the latest version of " +
        project +
        " for Minecraft " +
        primaryMinecraftVersion +
        " to Modrinth. " + changelogInfo,
      dependencies: [],
      game_versions: supportedMinecraftVersions,
      version_type: releaseType,
      loaders: [modLoader],
      featured: true,
      project_id: projectId,
      file_parts: ["file"],
      primary_file: "file",
    })
  );

  const fileData = fs.readFileSync(modInfo.fileName);
  form.append("file", fileData, {
    filename: modInfo.fileName,
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
