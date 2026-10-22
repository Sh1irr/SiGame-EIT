import { useState } from 'react';
import type { MediaBlock } from 'shared';
import styles from './MediaBlockListEditor.module.css';
import { mediaUrl, uploadMedia } from '../api';

interface MediaBlockListEditorProps {
  packId: string;
  blocks: MediaBlock[];
  onChange: (blocks: MediaBlock[]) => void;
}

type MediaKind = 'image' | 'audio' | 'video';

const ACCEPT: Record<MediaKind, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  audio: 'audio/mpeg,audio/ogg,audio/wav',
  video: 'video/mp4,video/webm',
};

const KIND_LABEL: Record<MediaBlock['type'], string> = {
  text: 'Текст',
  image: 'Картинка',
  audio: 'Аудіо',
  video: 'Відео',
};

function makeBlock(kind: MediaBlock['type']): MediaBlock {
  const id = crypto.randomUUID();
  return kind === 'text' ? { id, type: 'text', text: '' } : { id, type: kind, file: '', caption: '' };
}

export function MediaBlockListEditor({ packId, blocks, onChange }: MediaBlockListEditorProps) {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  function replaceBlock(index: number, block: MediaBlock) {
    onChange(blocks.map((b, i) => (i === index ? block : b)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addBlock(kind: MediaBlock['type']) {
    onChange([...blocks, makeBlock(kind)]);
  }

  async function handleUpload(index: number, block: MediaBlock & { type: MediaKind }, file: File) {
    setUploadingIds((prev) => new Set(prev).add(block.id));
    try {
      const uploaded = await uploadMedia(packId, file);
      replaceBlock(index, { ...block, file: uploaded });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не вдалося завантажити файл');
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(block.id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className={styles.list}>
        {blocks.map((block, index) => (
          <div className={styles.block} key={block.id}>
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.iconButton}
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
                title="Вище"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconButton}
                disabled={index === blocks.length - 1}
                onClick={() => moveBlock(index, 1)}
                title="Нижче"
              >
                ↓
              </button>
              <button type="button" className={styles.iconButton} onClick={() => removeBlock(index)} title="Видалити">
                ×
              </button>
            </div>
            <div className={styles.body}>
              <span className={styles.kindLabel}>{KIND_LABEL[block.type]}</span>
              {block.type === 'text' ? (
                <textarea
                  className={styles.textarea}
                  value={block.text}
                  onChange={(e) => replaceBlock(index, { ...block, text: e.target.value })}
                  placeholder="Текст…"
                />
              ) : (
                <>
                  {block.file ? (
                    <div className={styles.preview}>
                      {block.type === 'image' && <img src={mediaUrl(packId, block.file)} alt="" />}
                      {block.type === 'audio' && <audio controls src={mediaUrl(packId, block.file)} />}
                      {block.type === 'video' && <video controls src={mediaUrl(packId, block.file)} />}
                    </div>
                  ) : (
                    <span className={styles.uploadHint}>Файл ще не завантажено</span>
                  )}
                  <input
                    type="file"
                    accept={ACCEPT[block.type]}
                    disabled={uploadingIds.has(block.id)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void handleUpload(index, block, file);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.captionInput}
                    value={block.caption ?? ''}
                    placeholder="Підпис (необов'язково)"
                    onChange={(e) => replaceBlock(index, { ...block, caption: e.target.value })}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.addButton} onClick={() => addBlock('text')}>
          + Текст
        </button>
        <button type="button" className={styles.addButton} onClick={() => addBlock('image')}>
          + Картинка
        </button>
        <button type="button" className={styles.addButton} onClick={() => addBlock('audio')}>
          + Аудіо
        </button>
        <button type="button" className={styles.addButton} onClick={() => addBlock('video')}>
          + Відео
        </button>
      </div>
    </div>
  );
}
