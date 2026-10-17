import path from 'path';
import { fileURLToPath } from 'url';

export const getDirName = (metaUrl) => {
  const __filename = fileURLToPath(metaUrl);
  return path.dirname(__filename);
};