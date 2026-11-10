import { useEffect, useState } from "react";
import { ACADEMIC_CACHE_UPDATED_EVENT, academicDataErrorMessage } from "../academicData";
import { readSchoolProfile, SCHOOL_PROFILE_UPDATED_EVENT, type SchoolProfile } from "../schoolProfile";
import type { AcademicQueryResult } from "../types";

export function useAcademicCache<T>(load: (profile: SchoolProfile) => Promise<AcademicQueryResult<T>>) {
  // Khởi tạo state mặc định theo chuẩn mới
  const [result, setResult] = useState<AcademicQueryResult<T>>({
    status: 'LOADING',
    data: null,
    provenance: null
  });
  const [revision, setRevision] = useState(0);

  // CA-089.02: Hàm refetch dùng cho nút "Thử lại" trên UI
  const refetch = () => setRevision((value) => value + 1);

  useEffect(() => {
    window.addEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refetch);
    window.addEventListener(ACADEMIC_CACHE_UPDATED_EVENT, refetch);
    return () => {
      window.removeEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refetch);
      window.removeEventListener(ACADEMIC_CACHE_UPDATED_EVENT, refetch);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setResult((prev) => ({
      ...prev,
      status: 'LOADING', // Giữ nguyên data cũ (nếu có) để làm background revalidate
      error: undefined,
      isStale: false
    }));

    void load(readSchoolProfile())
      .then((res) => {
        if (cancelled) return;
        
        if (res.status === 'ERROR') {
          // CA-089.02 (Stale-while-revalidate): 
          // Nếu fetch lỗi mạng nhưng máy đang có cache cũ -> Bật cờ isStale và giữ data
          setResult((prev) => {
            if (prev.data) {
              return {
                ...res,
                data: prev.data,
                provenance: prev.provenance,
                isStale: true
              };
            }
            return res; // Nếu trống hoàn toàn thì hiển thị lỗi
          });
        } else {
          setResult(res); // Thành công hoặc Empty/Not_connected
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult((prev) => {
          const errStr = academicDataErrorMessage(error);
          if (prev.data) {
            return {
              status: 'ERROR',
              data: prev.data,
              provenance: prev.provenance,
              error: errStr,
              isStale: true
            };
          }
          return {
            status: 'ERROR',
            data: null,
            provenance: null,
            error: errStr
          };
        });
      });

    return () => { cancelled = true; };
  }, [load, revision]);

  return { result, refetch };
}