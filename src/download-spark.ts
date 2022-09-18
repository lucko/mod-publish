import axios from "axios";
import fs from "fs";
import * as Stream from "stream/promises";
import { FileInfo, ModLoaderType } from "./types";

export async function downloadSpark(
  modLoaderType: ModLoaderType
): Promise<FileInfo> {
  const versionsManifest = (
    await axios.get("https://sparkapi.lucko.me/download")
  ).data;
  const latestVersionInfo = versionsManifest[modLoaderType];

  const resp = await axios.get(latestVersionInfo.url, {
    responseType: "stream",
  });

  await Stream.pipeline(
    resp.data,
    fs.createWriteStream(latestVersionInfo.fileName)
  );

  return {
    fileName: latestVersionInfo.fileName,
    version: latestVersionInfo.fileName.split("-")[1],
  };
}
