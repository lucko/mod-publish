import { downloadLuckPerms } from "./download-luckperms";
import { downloadSpark } from "./download-spark";
import { ModLoaderType, PluginType } from "./types";
import {
  getGameVersionsData,
  getGameVersionTypesData,
  postToCurseForge,
} from "./upload-curseforge";
import { postModToModrinth, postPluginToModrinth } from "./upload-modrinth";

async function main() {
  if (process.argv.length != 3) {
    console.log("missing mod type argument!");
    return;
  }

  const type = process.argv[2];
  if (type === "spark") {
    await spark();
  } else if (type === "luckperms") {
    await luckPerms();
  } else if (type === "luckperms-plugin") {
    await luckPermsPlugin();
  } else if (type === "download") {
    await download();
  } else {
    console.log("Unknown type: " + type);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function download() {
  for (const modLoader of ["forge", "fabric", "neoforge"] as ModLoaderType[]) {
    let modInfo = await downloadSpark(modLoader);
    console.log({
      modInfo,
    });

    modInfo = await downloadLuckPerms(modLoader);
    console.log({
      modInfo,
    });
  }
}

async function spark() {
  const curseGameVersionTypes = await getGameVersionTypesData();
  const curseGameVersions = await getGameVersionsData();

  for (const modLoader of ["forge", "fabric", "neoforge"] as ModLoaderType[]) {
    console.log(`---- ${modLoader} ----`);

    const modInfo = await downloadSpark(modLoader);
    console.log({
      modInfo,
    });

    let resp;
    const changelogInfo =
      "The full changelog can be viewed at https://spark.lucko.me/changelog.";

    const releaseTypeMap: Record<ModLoaderType, "release" | "beta" | "alpha"> =
      {
        forge: "release",
        fabric: "beta",
        neoforge: "alpha",
      };

    console.log("Posting to CurseForge....");
    resp = await postToCurseForge(
      "spark",
      "361579",
      modLoader,
      modInfo,
      curseGameVersionTypes,
      curseGameVersions,
      releaseTypeMap[modLoader],
      changelogInfo
    );
    console.log("... success! sleeping for 5s.", resp);
    await sleep(5000);

    console.log("Posting to Modrinth....");
    resp = await postModToModrinth(
      "spark",
      "l6YH9Als",
      modLoader,
      modInfo,
      "release",
      changelogInfo
    );
    console.log("... success! sleeping for 5s.", resp);
    await sleep(5000);

    console.log("");
  }

  console.log("Done :)");
}

async function luckPerms() {
  const curseGameVersionTypes = await getGameVersionTypesData();
  const curseGameVersions = await getGameVersionsData();

  for (const modLoader of ["forge", "fabric", "neoforge"] as ModLoaderType[]) {
    console.log(`---- ${modLoader} ----`);

    const modInfo = await downloadLuckPerms(modLoader);
    console.log({
      modInfo,
    });

    let resp;
    const changelogInfo =
      "The full changelog can be viewed at https://luckperms.net/download.";

    const releaseTypeMap: Record<ModLoaderType, "release" | "beta" | "alpha"> =
      {
        forge: "beta",
        fabric: "release",
        neoforge: "alpha",
      };

    console.log("Posting to CurseForge....");
    resp = await postToCurseForge(
      "LuckPerms",
      "431733",
      modLoader,
      modInfo,
      curseGameVersionTypes,
      curseGameVersions,
      releaseTypeMap[modLoader],
      changelogInfo
    );
    console.log("... success! sleeping for 5s.", resp);
    await sleep(5000);

    console.log("Posting to Modrinth....");
    resp = await postModToModrinth(
      "LuckPerms",
      "Vebnzrzj",
      modLoader,
      modInfo,
      "release",
      changelogInfo
    );
    console.log("... success! sleeping for 5s.", resp);
    await sleep(5000);

    console.log("");
  }

  console.log("Done :)");
}

async function luckPermsPlugin() {
  for (const pluginType of ["bukkit", "bungee", "velocity"] as PluginType[]) {
    console.log(`---- ${pluginType} ----`);

    const pluginInfo = await downloadLuckPerms(pluginType);
    console.log({
      pluginInfo,
    });

    const changelogInfo =
      "The full changelog can be viewed at https://luckperms.net/download.";

    console.log("Posting to Modrinth....");
    const resp = await postPluginToModrinth(
      "LuckPerms",
      "Vebnzrzj",
      pluginType,
      pluginInfo,
      changelogInfo
    );
    console.log("... success! sleeping for 5s.", resp);
    await sleep(5000);

    console.log("");
  }

  console.log("Done :)");
}

(async () => {
  await main();
})();
