import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { FileInfo, ModLoaderType } from "./types";
import {
  baseMinecraftVersion,
  primaryMinecraftVersion,
  supportedMinecraftVersions,
} from "./version";

const supportedJavaVersions = ["java-21"];

const knownGameVersionTypes = {
  java: 2,
  modloader: 68441,
};

export interface GameVersionTypesData {
  id: number;
  name: string;
  slug: string;
}

export async function getGameVersionTypesData(): Promise<
  GameVersionTypesData[]
> {
  const gameVersionTypes = (
    await axios.get("https://minecraft.curseforge.com/api/game/version-types", {
      headers: {
        "X-Api-Token": process.env.CURSE_API_TOKEN as string,
        "User-Agent": "github.com/lucko/mod-publish",
      },
    })
  ).data;
  return gameVersionTypes;
}

export interface GameVersionsData {
  id: number;
  gameVersionTypeID: number;
  name: string;
  slug: string;
}

export async function getGameVersionsData(): Promise<GameVersionsData[]> {
  const gameVersions = (
    await axios.get("https://minecraft.curseforge.com/api/game/versions", {
      headers: {
        "X-Api-Token": process.env.CURSE_API_TOKEN as string,
        "User-Agent": "github.com/lucko/mod-publish",
      },
    })
  ).data;
  return gameVersions;
}

export function getSupportedGameVersionIds(
  gameVersionTypes: GameVersionTypesData[],
  gameVersions: GameVersionsData[],
  modLoaderType: ModLoaderType
) {
  const javaGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID === knownGameVersionTypes.java &&
      supportedJavaVersions.includes(version.slug)
  );

  const modloaderGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID === knownGameVersionTypes.modloader &&
      version.slug === modLoaderType
  );

  const minecraftGameVersionTypes = gameVersionTypes.filter(
    (version) => version.name == `Minecraft ${baseMinecraftVersion}`
  );
  if (minecraftGameVersionTypes.length != 1) {
    throw new Error(
      "Invalid number of Minecraft versions (expecting one!) " +
        JSON.stringify(minecraftGameVersionTypes, null, 2)
    );
  }

  const minecraftGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID === minecraftGameVersionTypes[0].id &&
      supportedMinecraftVersions.includes(version.name)
  );

  const supportedVersionIds = [
    ...javaGameVersions,
    ...modloaderGameVersions,
    ...minecraftGameVersions,
  ].map((version) => version.id);

  return supportedVersionIds;
}

export async function postToCurseForge(
  project: string,
  projectId: string,
  modLoader: ModLoaderType,
  modInfo: FileInfo,
  curseGameVersionTypes: GameVersionTypesData[],
  curseGameVersions: GameVersionsData[],
  releaseType: "release" | "beta" | "alpha",
  changelogInfo: string
) {
  const supportedVersionIds = getSupportedGameVersionIds(
    curseGameVersionTypes,
    curseGameVersions,
    modLoader
  );

  const form = new FormData();

  const modLoaderCaptialised = {
    forge: "Forge",
    fabric: "Fabric",
    neoforge: "NeoForge",
  }[modLoader];

  form.append(
    "metadata",
    JSON.stringify({
      changelog:
        "This update brings the latest version of " +
        project +
        " for Minecraft " +
        primaryMinecraftVersion +
        " to CurseForge. " +
        changelogInfo,
      displayName: `${modInfo.version} (${modLoaderCaptialised} ${primaryMinecraftVersion})`,
      gameVersions: supportedVersionIds,
      releaseType: releaseType,
    })
  );

  const fileData = fs.readFileSync(modInfo.fileName);
  form.append("file", fileData, {
    filename: modInfo.fileName,
    contentType: "application/java-archive",
    knownLength: fileData.length,
  });

  try {
    // https://support.curseforge.com/en/support/solutions/articles/9000197321-curseforge-upload-api
    const resp = await axios.post(
      `https://minecraft.curseforge.com/api/projects/${projectId}/upload-file`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-Api-Token": process.env.CURSE_API_TOKEN as string,
          "User-Agent": "github.com/lucko/mod-publish",
          Accept: "application/json",
        },
      }
    );
    return resp.data;
  } catch (e: any) {
    console.error("response status: ", e.response?.status);
    console.error("response data: ", e.response?.data);
    console.error("response headers: ", e.response?.headers);
    console.error("response: ", e.toJSON());
  }
}
