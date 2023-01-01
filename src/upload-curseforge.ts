import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { FileInfo, ModLoaderType } from "./types";

const supportedJavaVersions = ["java-17", "java-18"];
const supportedMinecraftVersion = "1.19";

const gameVersionTypes = {
  java: 2,
  modloader: 68441,
};

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
  gameVersions: GameVersionsData[],
  modLoaderType: ModLoaderType
) {
  const javaGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID === gameVersionTypes.java &&
      supportedJavaVersions.includes(version.slug)
  );

  const modloaderGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID === gameVersionTypes.modloader &&
      version.slug === modLoaderType
  );

  let minecraftGameVersions = gameVersions.filter(
    (version) => version.name === `${supportedMinecraftVersion}-Snapshot`
  );
  if (minecraftGameVersions.length != 1) {
    throw new Error(
      "Invalid number of Minecraft versions (expecting one snapshot!) " +
        JSON.stringify(minecraftGameVersions, null, 2)
    );
  }
  minecraftGameVersions = gameVersions.filter(
    (version) =>
      version.gameVersionTypeID ===
        minecraftGameVersions[0].gameVersionTypeID &&
      !version.name.includes("Snapshot")
  );

  const latestSupportedVersion = minecraftGameVersions.sort(
    (a, b) => b.id - a.id
  )[0].name;

  const supportedVersionIds = [
    ...javaGameVersions,
    ...modloaderGameVersions,
    ...minecraftGameVersions,
  ].map((version) => version.id);

  return { latestSupportedVersion, supportedVersionIds };
}

export async function postToCurseForge(
  project: string,
  projectId: string,
  modLoader: ModLoaderType,
  modInfo: FileInfo,
  curseGameVersions: GameVersionsData[],
  releaseType: "release" | "beta" | "alpha",
  changelogInfo: string
) {
  const { latestSupportedVersion, supportedVersionIds } =
    getSupportedGameVersionIds(curseGameVersions, modLoader);

  const form = new FormData();

  const modLoaderCaptialised =
    modLoader.charAt(0).toUpperCase() + modLoader.slice(1);

  form.append(
    "metadata",
    JSON.stringify({
      changelog:
        "This update brings the latest version of " +
        project +
        " for Minecraft " +
        latestSupportedVersion +
        " to CurseForge. " + changelogInfo,
      displayName: `${modInfo.version} (${modLoaderCaptialised} ${latestSupportedVersion})`,
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
