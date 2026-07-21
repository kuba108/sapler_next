import type { SectionData, WrapperData } from './PageComposer';
import type { WidgetData } from './WidgetEditor';
import { WRAPPER_PARTS } from '@/lib/widgets';

/** Immutable helpers for moving items around the section → wrapper → widget tree. */

export function moveSection(
  sections: SectionData[],
  dragId: string,
  targetId: string,
): SectionData[] {
  if (dragId === targetId) return sections;
  const next = [...sections];
  const from = next.findIndex((s) => s.id === dragId);
  const to = next.findIndex((s) => s.id === targetId);
  if (from === -1 || to === -1) return sections;
  const [moved] = next.splice(from, 1);
  const insertAt = next.findIndex((s) => s.id === targetId);
  next.splice(insertAt, 0, moved);
  return next;
}

function findWrapper(
  sections: SectionData[],
  wrapperId: string,
): { sectionId: string; wrapper: WrapperData } | null {
  for (const s of sections) {
    const w = s.wrappers.find((x) => x.id === wrapperId);
    if (w) return { sectionId: s.id, wrapper: w };
  }
  return null;
}

export function moveWrapper(
  sections: SectionData[],
  dragId: string,
  targetSectionId: string,
  targetWrapperId: string | null,
): SectionData[] {
  const found = findWrapper(sections, dragId);
  if (!found) return sections;

  const next = sections.map((s) => ({
    ...s,
    wrappers: s.wrappers.filter((w) => w.id !== dragId),
  }));

  const target = next.find((s) => s.id === targetSectionId);
  if (!target) return sections;

  const insertAt =
    targetWrapperId != null
      ? target.wrappers.findIndex((w) => w.id === targetWrapperId)
      : target.wrappers.length;
  target.wrappers.splice(insertAt < 0 ? target.wrappers.length : insertAt, 0, found.wrapper);
  return next;
}

function findWidget(
  sections: SectionData[],
  wwId: string,
): { wrapperId: string; part: string; widget: WidgetData } | null {
  for (const s of sections) {
    for (const w of s.wrappers) {
      for (const part of Object.keys(w.parts)) {
        const widget = w.parts[part]?.find((x) => x.wrapperWidgetId === wwId);
        if (widget) return { wrapperId: w.id, part, widget };
      }
    }
  }
  return null;
}

export function moveWidget(
  sections: SectionData[],
  dragWwId: string,
  targetWrapperId: string,
  targetPart: string,
  targetWwId: string | null,
): SectionData[] {
  const found = findWidget(sections, dragWwId);
  if (!found) return sections;

  // Remove from source everywhere.
  const next = sections.map((s) => ({
    ...s,
    wrappers: s.wrappers.map((w) => {
      const parts: Record<string, WidgetData[]> = {};
      for (const p of Object.keys(w.parts)) {
        parts[p] = (w.parts[p] ?? []).filter((x) => x.wrapperWidgetId !== dragWwId);
      }
      return { ...w, parts };
    }),
  }));

  // Insert into target.
  for (const s of next) {
    const w = s.wrappers.find((x) => x.id === targetWrapperId);
    if (w) {
      if (!w.parts[targetPart]) w.parts[targetPart] = [];
      const arr = w.parts[targetPart];
      const insertAt =
        targetWwId != null ? arr.findIndex((x) => x.wrapperWidgetId === targetWwId) : arr.length;
      arr.splice(insertAt < 0 ? arr.length : insertAt, 0, found.widget);
      break;
    }
  }
  return next;
}

export function wrapperIds(section: SectionData): string[] {
  return section.wrappers.map((w) => w.id);
}

export function partWidgetIds(
  sections: SectionData[],
  wrapperId: string,
  part: string,
): string[] {
  const found = findWrapper(sections, wrapperId);
  return found ? (found.wrapper.parts[part] ?? []).map((w) => w.wrapperWidgetId) : [];
}

export function widgetSource(sections: SectionData[], wwId: string) {
  return findWidget(sections, wwId);
}

export function wrapperSection(sections: SectionData[], wrapperId: string) {
  return findWrapper(sections, wrapperId)?.sectionId ?? null;
}

export { WRAPPER_PARTS };
