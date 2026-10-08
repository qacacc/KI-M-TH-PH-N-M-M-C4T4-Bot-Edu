import { getStoredSession } from "./schoolVault";
import { SUPPORTED_UNIVERSITIES } from "./types";
import { readSchoolProfile } from "../schoolProfile";
import { normalizeVietnamese } from "../engine";

export interface SchoolChatAnswer {
  isSchoolQuery: boolean;
  answerMarkdown: string;
}

/**
 * Các chủ đề câu hỏi về trường — mỗi topic có nhiều alias tự nhiên (không dấu, so sánh sau normalize).
 * Cấu trúc topic-based thay thế cho keyword list phẳng cứng cũ.
 */
const SCHOOL_TOPICS: {
  id: string;
  /** Alias dùng để match — viết không dấu, sau normalizeVietnamese */
  triggers: string[];
}[] = [
  {
    id: "admission",
    triggers: [
      "nhap hoc", "tan sinh vien", "thu tuc nhap hoc", "ky nhap hoc",
      "ho so nhap hoc", "chup anh the", "the sinh vien",
      "bao danh nhap hoc", "xac nhan nhap hoc", "lich nhap hoc",
    ],
  },
  {
    id: "campus_map",
    triggers: [
      "so do", "co so", "ban do truong", "phong may",
      "thu vien", "hoi truong", "ktx", "ky tuc xa", "dia chi truong",
      "co so 1", "co so 2",
    ],
  },
  {
    id: "handbook",
    triggers: [
      "quy che", "so tay", "quy dinh", "ren luyen", "diem ren luyen",
      "quy che dao tao", "xet canh cao", "buoc thoi hoc", "tin chi",
    ],
  },
  {
    id: "student_id",
    triggers: [
      "mssv", "ma sinh vien", "tai khoan truong", "dang nhap portal",
      "mat khau truong", "sso", "email sinh vien", "cap lai mat khau",
    ],
  },
  {
    id: "tuition",
    triggers: [
      "hoc phi", "dong hoc phi", "cong no", "hoc bong",
      "mien giam", "hoc phi hoc ky", "han dong hoc phi",
    ],
  },
  {
    id: "school_general",
    triggers: [
      "uth", "gtvt", "bach khoa", "hcmut", "khtn", "hcmus",
      "su pham", "hcmue", "truong dai hoc", "thong tin truong",
    ],
  },
];

/**
 * Phân tích câu hỏi về Trường ĐH trong Chat AI.
 * Dùng normalizeVietnamese để so sánh — tránh miss do dấu hoặc encoding.
 */
export function handleSchoolChatQuery(query: string): SchoolChatAnswer {
  const normalized = normalizeVietnamese(query);

  // Tìm tất cả topic phù hợp
  const matchedTopics = SCHOOL_TOPICS.filter((topic) =>
    topic.triggers.some((trigger) => normalized.includes(trigger))
  );

  if (matchedTopics.length === 0) {
    return { isSchoolQuery: false, answerMarkdown: "" };
  }

  const profile = readSchoolProfile();
  const session = getStoredSession();
  const topicIds = matchedTopics.map((t) => t.id);

  let text = "";

  // --- Header: Trạng thái hồ sơ ---
  text += `🎓 **Trường đang chọn: ${profile.schoolName}**\n`;
  if (profile.displayName) text += `- **Sinh viên:** ${profile.displayName}\n`;
  if (profile.studentCode) text += `- **MSSV:** ${profile.studentCode}\n`;
  text += `- **Chế độ:** ${profile.mode === "student" ? "Sinh viên đang học" : "Tân sinh viên / Chưa đăng nhập"}\n`;

  if (session) {
    const expDate = new Date(session.expiresAt).toLocaleDateString("vi-VN");
    text += `- **Phiên cổng trường:** Có metadata local (Hết hạn: ${expDate})\n`;
  } else {
    text += `- **Phiên cổng trường:** Chưa đồng bộ với cổng trường\n`;
  }
  text += `\n`;

  // --- Nội dung theo topic ---
  if (topicIds.includes("student_id")) {
    text += `🔑 **Tài khoản & MSSV:**\n`;
    text += `- Tra cứu/lấy lại MSSV: đăng nhập cổng sinh viên trường.\n`;
    text += `- Vào trang **Trường & Tài khoản** → nhấn **Mở Portal** để đăng nhập.\n`;
    text += `- App không lưu mật khẩu, token hoặc cookie.\n\n`;
  }

  if (topicIds.includes("tuition")) {
    text += `💰 **Học phí & Tín chỉ:**\n`;
    text += `- Thông tin học phí chỉ có trên cổng cá nhân (sau đăng nhập).\n`;
    text += `- Mở cổng: **Trường & Tài khoản** → **Mở Portal**.\n\n`;
  }

  // --- Hướng dẫn mở cổng trường ---
  const school = SUPPORTED_UNIVERSITIES.find((u) => u.id === profile.schoolId);
  const portalUrl = school?.studentPortalUrl;

  text += `🔗 **Mở cổng thông tin ${profile.schoolName}:**\n`;
  if (portalUrl) {
    text += `- Truy cập trực tiếp: [${portalUrl}](${portalUrl})\n`;
  }
  text += `- Hoặc vào trang **Trường & Tài khoản** trong app → nhấn nút **Mở Portal**.\n`;

  return {
    isSchoolQuery: true,
    answerMarkdown: text,
  };
}

/**
 * Gợi ý câu hỏi nhanh liên quan đến trường trong chat UI
 */
export function getSchoolQuickReplies(schoolId: string): string[] {
  const school = SUPPORTED_UNIVERSITIES.find((u) => u.id === schoolId);
  const name = school?.shortName ?? "trường";
  return [
    `Thủ tục nhập học ${name}`,
    `Sơ đồ cơ sở ${name}`,
    `Quy chế đào tạo tín chỉ`,
    `Học phí học kỳ này`,
    `Mở cổng sinh viên ${name}`,
  ];
}
