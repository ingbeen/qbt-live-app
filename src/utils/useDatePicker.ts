import { useCallback, useState } from 'react';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { toIsoDate } from './parse';

// FillForm / AdjustForm 의 DateTimePicker 상태 관리 공용 훅.
// showPicker on/off + 선택 시 onSet 콜백으로 ISO 문자열 전달.

export interface UseDatePickerResult {
  showPicker: boolean;
  openPicker: () => void;
  onPickerChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
}

export const useDatePicker = (
  onSet: (iso: string) => void,
): UseDatePickerResult => {
  const [showPicker, setShowPicker] = useState(false);

  const openPicker = useCallback(() => setShowPicker(true), []);

  const onPickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onSet(toIsoDate(selectedDate));
      }
    },
    [onSet],
  );

  return { showPicker, openPicker, onPickerChange };
};
