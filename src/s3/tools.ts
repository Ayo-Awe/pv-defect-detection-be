import { bucketUrl } from "./config";

export function buildFileUrl(filekey: string) {
  return `${bucketUrl}/${filekey}`;
}
