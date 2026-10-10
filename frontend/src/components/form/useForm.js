'use client';

/** State formulir + submit dengan penanganan error field dari backend dan toast. */
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export function useFormSubmit(initial = {}) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (fn, successMsg) => {
    setSaving(true); setErrors({}); setError(null);
    try {
      const res = await fn();
      if (successMsg) toast(successMsg);
      return res;
    } catch (e) {
      setError(e.message);
      if (e.fieldErrors) setErrors(e.fieldErrors());
      toast(e.message, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };
  return { value, setValue, errors, error, saving, submit };
}
