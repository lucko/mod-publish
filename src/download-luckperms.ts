import axios from "axios";
import fs from "fs";
import * as Stream from "stream/promises";
import { FileInfo, ModLoaderType } from "./types";

export async function downloadLuckPerms(
  modLoaderType: ModLoaderType
): Promise<FileInfo> {
  const dataManifest = (
    await axios.get("https://metadata.luckperms.net/data/all")
  ).data;
  const url = dataManifest.downloads[modLoaderType] as string;
  const fileName = url.substring(url.lastIndexOf("/") + 1);

  const resp = await axios.get(url, {
    responseType: "stream",
  });

  await Stream.pipeline(resp.data, fs.createWriteStream(fileName));

  return {
    fileName: fileName,
    version: `v${dataManifest.version}`,
  };
}
