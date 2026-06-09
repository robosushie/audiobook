import { getApiBaseUrl } from '@/lib/env';
import { Directory, File, Paths } from 'expo-file-system';

export async function ensureAudiobookAudioFile(
  token: string,
  audiobookId: string,
): Promise<string> {
  const cacheDir = new Directory(Paths.cache, 'audiobooks');
  if (!cacheDir.exists) {
    cacheDir.create({ intermediates: true, idempotent: true });
  }

  const localFile = new File(cacheDir, `${audiobookId}.wav`);
  if (localFile.exists && localFile.size > 0) {
    return localFile.uri;
  }

  const url = `${getApiBaseUrl()}/api/audiobooks/${audiobookId}/audio`;
  const downloaded = await File.downloadFileAsync(url, localFile, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });

  return downloaded.uri;
}
