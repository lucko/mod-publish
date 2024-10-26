import axios from "axios";
import fs from "fs";
import * as Stream from "stream/promises";
import { FileInfo, ModLoaderType, PluginType } from "./types";

export async function downloadLuckPerms(
  type: ModLoaderType | PluginType
): Promise<FileInfo> {
  const dataManifest = (
    await axios.get("https://metadata.luckperms.net/data/all")
  ).data;
  const url = dataManifest.downloads[type] as string;
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
