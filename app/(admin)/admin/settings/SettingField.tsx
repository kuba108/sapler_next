'use client';

import { saveSetting } from './actions';
import InlineEditor from '@/components/admin/InlineEditor';

/** Inline text setting editor — mirrors the Rails text_editor component. */
export default function SettingField({
  label,
  name,
  defaultValue,
  valueType = 'String',
}: {
  label: string;
  name: string;
  defaultValue: string;
  valueType?: string;
}) {
  return (
    <div className="card-row">
      <InlineEditor
        label={label}
        value={defaultValue}
        saveValue={(value) => saveSetting(name, value, valueType)}
      />
    </div>
  );
}
