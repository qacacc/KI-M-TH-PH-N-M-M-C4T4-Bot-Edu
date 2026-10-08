import { PublicSchoolDocument, SUPPORTED_UNIVERSITIES } from "./types";
import { getPublicSchoolDocs } from "./schoolVault";

export interface SchoolSearchResult {
  schoolName: string;
  documents: PublicSchoolDocument[];
}

/**
 * Tìm kiếm thông tin trường học công khai (Public Portal Mode) theo từ khóa và mã trường
 */
export function searchPublicSchoolData(query: string, schoolIdFilter?: string): SchoolSearchResult[] {
  const q = query.toLowerCase().trim();
  const results: SchoolSearchResult[] = [];

  const targetSchools = schoolIdFilter
    ? SUPPORTED_UNIVERSITIES.filter((u) => u.id === schoolIdFilter)
    : SUPPORTED_UNIVERSITIES;

  for (const school of targetSchools) {
    const docs = getPublicSchoolDocs(school.id);
    const matchedDocs = docs.filter(
      (d) =>
        q === "" ||
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        school.name.toLowerCase().includes(q) ||
        school.code.toLowerCase().includes(q)
    );

    if (matchedDocs.length > 0) {
      results.push({
        schoolName: school.name,
        documents: matchedDocs,
      });
    }
  }

  return results;
}
