import { useEffect, useState } from "react";
import { ACADEMIC_CACHE_UPDATED_EVENT, academicDataErrorMessage } from "../academicData";
import { readSchoolProfile, SCHOOL_PROFILE_UPDATED_EVENT, type SchoolProfile } from "../schoolProfile";

export function useAcademicCache<T>(load: (profile: SchoolProfile) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refresh);
    window.addEventListener(ACADEMIC_CACHE_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refresh);
      window.removeEventListener(ACADEMIC_CACHE_UPDATED_EVENT, refresh);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setError("");
    setLoading(true);
    void load(readSchoolProfile()).then((records) => {
      if (!cancelled) setItems(records);
    }).catch((error: unknown) => {
      if (!cancelled) setError(academicDataErrorMessage(error));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [load, revision]);
  return { items, loading, error };
}
