use crate::models::{PublicSearchResponse, PublicSearchResult};
use std::io::Read;
use ureq::ResponseExt;
use std::time::{Duration, Instant};

struct PublicSchoolSource {
    id: &'static str,
    name: &'static str,
    urls: &'static [&'static str],
    // CA-093.02: tên miền chính thống (khớp chính xác hoặc subdomain) được phép cào
    domains: &'static [&'static str],
}

const UTH_PUBLIC_URLS: &[&str] = &[
    "https://uth.edu.vn/",
    "https://ut.edu.vn/",
    "https://portal.ut.edu.vn/",
    "https://tuyensinh.ut.edu.vn/",
    "https://ts26.uth.edu.vn/",
];

const HCMUT_PUBLIC_URLS: &[&str] = &[
    "https://hcmut.edu.vn/",
    "https://tuyensinh.hcmut.edu.vn/",
    "https://aao.hcmut.edu.vn/",
];

const HCMUS_PUBLIC_URLS: &[&str] = &[
    "https://hcmus.edu.vn/",
    "https://tuyensinh.hcmus.edu.vn/",
    "https://portal.hcmus.edu.vn/",
];

const HCMUE_PUBLIC_URLS: &[&str] = &[
    "https://hcmue.edu.vn/",
    "https://tuyensinh.hcmue.edu.vn/",
];

const UTH_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "uth",
    name: "Truong Dai hoc Giao thong van tai TP.HCM",
    urls: UTH_PUBLIC_URLS,
    domains: &["uth.edu.vn", "ut.edu.vn"],
};

const HCMUT_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmut",
    name: "Truong Dai hoc Bach khoa - DHQG-HCM",
    urls: HCMUT_PUBLIC_URLS,
    domains: &["hcmut.edu.vn"],
};

const HCMUS_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmus",
    name: "Truong Dai hoc Khoa hoc Tu nhien - DHQG-HCM",
    urls: HCMUS_PUBLIC_URLS,
    domains: &["hcmus.edu.vn"],
};

const HCMUE_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmue",
    name: "Truong Dai hoc Su pham TP.HCM",
    urls: HCMUE_PUBLIC_URLS,
    domains: &["hcmue.edu.vn"],
};

const ALL_SOURCES: &[&PublicSchoolSource] = &[&UTH_SOURCE, &HCMUT_SOURCE, &HCMUS_SOURCE, &HCMUE_SOURCE];

fn source_for_school(school_id: &str) -> Option<&'static PublicSchoolSource> {
    match school_id.trim().to_lowercase().as_str() {
        "uth" => Some(&UTH_SOURCE),
        "hcmut" => Some(&HCMUT_SOURCE),
        "hcmus" => Some(&HCMUS_SOURCE),
        "hcmue" => Some(&HCMUE_SOURCE),
        _ => None,
    }
}

fn sanitize_query(query: &str) -> Result<String, String> {
    let trimmed = query.trim();
    if trimmed.len() < 2 {
        return Err("Tu khoa qua ngan de tra cuu tren nguon cong khai.".to_string());
    }
    if trimmed.len() > 160 {
        return Err("Tu khoa qua dai. Hay rut gon cau hoi truoc khi tra cuu.".to_string());
    }

    // Mandatory PII Sanitization (SEC-004): Lọc MSSV (8-15 chữ số) và email trước khi gửi request ra internet
    let mut cleaned = String::new();
    for token in trimmed.split_whitespace() {
        let is_numeric_id = token.len() >= 8 && token.len() <= 15 && token.chars().all(|c| c.is_ascii_digit());
        let is_email = token.contains('@');
        if !is_numeric_id && !is_email {
            if !cleaned.is_empty() {
                cleaned.push(' ');
            }
            cleaned.push_str(token);
        }
    }
    let cleaned = cleaned.trim();
    if cleaned.len() < 2 {
        return Err("Tu khoa sau khi xoa PII nhay cam qua ngan de tra cuu.".to_string());
    }
    Ok(cleaned.to_string())
}

fn normalize_text(input: &str) -> String {
    input
        .trim()
        .to_lowercase()
        .replace('đ', "d")
        .replace(
            [
                'á', 'à', 'ả', 'ã', 'ạ', 'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ', 'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
            ],
            "a",
        )
        .replace(['é', 'è', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'], "e")
        .replace(['í', 'ì', 'ỉ', 'ĩ', 'ị'], "i")
        .replace(
            [
                'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
            ],
            "o",
        )
        .replace(['ú', 'ù', 'ủ', 'ũ', 'ụ', 'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'], "u")
        .replace(['ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'], "y")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn decode_html_entities(input: &str) -> String {
    // Giải mã một lượt (không giải mã lặp "&amp;lt;"), hỗ trợ entity tên phổ biến và entity số
    let mut output = String::with_capacity(input.len());
    let mut rest = input;
    while let Some(amp) = rest.find('&') {
        output.push_str(&rest[..amp]);
        let after = &rest[amp + 1..];
        let decoded = after
            .find(';')
            .filter(|end| *end > 0 && *end <= 10)
            .and_then(|end| decode_entity(&after[..end]).map(|ch| (ch, end)));
        match decoded {
            Some((ch, end)) => {
                output.push(ch);
                rest = &after[end + 1..];
            }
            None => {
                output.push('&');
                rest = after;
            }
        }
    }
    output.push_str(rest);
    output
}

fn decode_entity(name: &str) -> Option<char> {
    if let Some(number) = name.strip_prefix('#') {
        let code = match number.strip_prefix(['x', 'X']) {
            Some(hex) => u32::from_str_radix(hex, 16).ok()?,
            None => number.parse::<u32>().ok()?,
        };
        return Some(
            char::from_u32(code)
                .filter(|ch| *ch != '\0')
                .unwrap_or('\u{FFFD}'),
        );
    }
    let ch = match name {
        "amp" => '&',
        "lt" => '<',
        "gt" => '>',
        "quot" => '"',
        "apos" => '\'',
        "nbsp" => ' ',
        "ndash" => '–',
        "mdash" => '—',
        "hellip" => '…',
        "laquo" => '«',
        "raquo" => '»',
        "ldquo" => '“',
        "rdquo" => '”',
        "lsquo" => '‘',
        "rsquo" => '’',
        "bull" => '•',
        "copy" => '©',
        _ => return None,
    };
    Some(ch)
}

// CA-093.02: nội dung thô (raw text) bỏ hẳn, kể cả khi chứa chuỗi giống thẻ đóng của phần tử cha
const RAW_TEXT_TAGS: &[&str] = &["script", "style", "noscript", "template", "textarea", "title"];
// Khối điều hướng/khung trang/tương tác không phải nội dung tài liệu
const NOISE_TAGS: &[&str] = &[
    "nav", "aside", "footer", "form", "button", "select", "svg", "iframe", "object", "canvas",
    "dialog", "menu",
];
const VOID_TAGS: &[&str] = &[
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source",
    "track", "wbr",
];
const BLOCK_TAGS: &[&str] = &[
    "p", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "br", "tr", "td", "th",
    "section", "article", "main", "table", "blockquote", "pre", "dd", "dt", "figcaption", "hr",
    "header", "address",
];
// Token class/id thường dùng cho quảng cáo hoặc phần tử ẩn
const NOISE_CLASS_TOKENS: &[&str] = &[
    "ad", "ads", "advert", "advertisement", "banner", "sponsor", "sponsored", "quangcao", "popup",
    "cookie", "hidden", "invisible", "share", "social", "breadcrumb", "sidebar",
];

struct HtmlTag<'a> {
    name: String,
    closing: bool,
    self_closing: bool,
    attrs: Vec<(String, &'a str)>,
}

fn find_ascii_ci(haystack: &str, needle: &str, from: usize) -> Option<usize> {
    let bytes = haystack.as_bytes();
    let needle = needle.as_bytes();
    if from > bytes.len() || needle.is_empty() {
        return None;
    }
    bytes[from..]
        .windows(needle.len())
        .position(|window| window.eq_ignore_ascii_case(needle))
        .map(|offset| from + offset)
}

// Đọc một thẻ bắt đầu tại `start` (ký tự '<'); trả về thẻ và vị trí sau dấu '>'
fn parse_tag(html: &str, start: usize) -> Option<(HtmlTag<'_>, usize)> {
    let bytes = html.as_bytes();
    let mut pos = start + 1;
    let closing = bytes.get(pos) == Some(&b'/');
    if closing {
        pos += 1;
    }
    if !bytes.get(pos).is_some_and(|byte| byte.is_ascii_alphabetic()) {
        return None;
    }
    let name_start = pos;
    while bytes
        .get(pos)
        .is_some_and(|byte| byte.is_ascii_alphanumeric() || *byte == b'-' || *byte == b':')
    {
        pos += 1;
    }
    let name = html[name_start..pos].to_ascii_lowercase();
    let mut attrs = Vec::new();
    let mut self_closing = false;

    loop {
        while bytes.get(pos).is_some_and(|byte| byte.is_ascii_whitespace()) {
            pos += 1;
        }
        match bytes.get(pos) {
            None => {
                let tag = HtmlTag { name, closing, self_closing, attrs };
                return Some((tag, bytes.len()));
            }
            Some(b'>') => {
                let tag = HtmlTag { name, closing, self_closing, attrs };
                return Some((tag, pos + 1));
            }
            Some(b'/') => {
                self_closing = true;
                pos += 1;
                continue;
            }
            _ => {}
        }
        let attr_start = pos;
        while bytes.get(pos).is_some_and(|byte| {
            !byte.is_ascii_whitespace() && !matches!(byte, b'=' | b'>' | b'/')
        }) {
            pos += 1;
        }
        let attr_name = html[attr_start..pos].to_ascii_lowercase();
        self_closing = false;
        let mut value = "";
        if bytes.get(pos) == Some(&b'=') {
            pos += 1;
            match bytes.get(pos) {
                Some(&quote) if quote == b'"' || quote == b'\'' => {
                    let value_start = pos + 1;
                    let value_end = html[value_start..]
                        .find(quote as char)
                        .map(|offset| value_start + offset)
                        .unwrap_or(bytes.len());
                    value = &html[value_start..value_end];
                    pos = (value_end + 1).min(bytes.len());
                }
                _ => {
                    let value_start = pos;
                    while bytes
                        .get(pos)
                        .is_some_and(|byte| !byte.is_ascii_whitespace() && *byte != b'>')
                    {
                        pos += 1;
                    }
                    value = &html[value_start..pos];
                }
            }
        }
        if !attr_name.is_empty() {
            attrs.push((attr_name, value));
        }
    }
}

fn is_noise_element(tag: &HtmlTag, inside_content: bool) -> bool {
    if NOISE_TAGS.contains(&tag.name.as_str()) || (tag.name == "header" && !inside_content) {
        return true;
    }
    tag.attrs.iter().any(|(name, value)| {
        let value = value.to_ascii_lowercase();
        match name.as_str() {
            "hidden" => true,
            "aria-hidden" => value.trim() == "true",
            "style" => {
                let compact = value.split_whitespace().collect::<String>();
                compact.contains("display:none") || compact.contains("visibility:hidden")
            }
            "class" | "id" => {
                value
                    .split(|ch: char| ch.is_whitespace() || ch == '-' || ch == '_')
                    .any(|token| NOISE_CLASS_TOKENS.contains(&token))
                    || value.contains("quang-cao")
                    || value.split_whitespace().any(|class| class == "d-none")
            }
            _ => false,
        }
    })
}

// Xuống dòng trong mã nguồn HTML chỉ là khoảng trắng; dòng mới chỉ sinh ra từ thẻ khối
fn push_text_segment(output: &mut String, segment: &str) {
    let decoded = decode_html_entities(segment);
    output.extend(decoded.chars().map(|ch| if ch.is_whitespace() { ' ' } else { ch }));
}

// CA-093.02: bóc tách văn bản đọc được; mỗi khối nội dung là một dòng, bỏ dòng trùng lặp
fn strip_html_to_text(html: &str) -> String {
    let bytes = html.as_bytes();
    let mut raw = String::with_capacity(html.len().min(64_000));
    let mut open_tags: Vec<String> = Vec::new();
    // (tên thẻ, độ sâu lồng) của khối nhiễu đang bị bỏ qua
    let mut skipping: Option<(String, usize)> = None;
    let mut pos = 0;
    let mut text_start = 0;

    while let Some(offset) = html[pos..].find('<') {
        let lt = pos + offset;
        if skipping.is_none() {
            push_text_segment(&mut raw, &html[text_start..lt]);
        }

        if html[lt..].starts_with("<!--") {
            pos = html[lt + 4..]
                .find("-->")
                .map(|end| lt + 4 + end + 3)
                .unwrap_or(bytes.len());
            text_start = pos;
            continue;
        }
        if matches!(bytes.get(lt + 1), Some(b'!' | b'?')) {
            pos = html[lt..]
                .find('>')
                .map(|end| lt + end + 1)
                .unwrap_or(bytes.len());
            text_start = pos;
            continue;
        }
        let Some((tag, after)) = parse_tag(html, lt) else {
            // Dấu '<' trong văn bản thường, giữ nguyên
            if skipping.is_none() {
                raw.push('<');
            }
            pos = lt + 1;
            text_start = pos;
            continue;
        };
        pos = after;
        text_start = pos;

        if !tag.closing && RAW_TEXT_TAGS.contains(&tag.name.as_str()) {
            pos = find_ascii_ci(html, &format!("</{}", tag.name), pos)
                .and_then(|close| html[close..].find('>').map(|end| close + end + 1))
                .unwrap_or(bytes.len());
            text_start = pos;
            continue;
        }

        let is_void = VOID_TAGS.contains(&tag.name.as_str()) || tag.self_closing;
        if let Some((name, depth)) = skipping.as_mut() {
            if *name == tag.name && !is_void {
                if tag.closing {
                    *depth -= 1;
                    if *depth == 0 {
                        skipping = None;
                        raw.push('\n');
                    }
                } else {
                    *depth += 1;
                }
            }
            continue;
        }

        if tag.closing {
            if let Some(index) = open_tags.iter().rposition(|open| *open == tag.name) {
                open_tags.truncate(index);
            }
        } else {
            let inside_content = open_tags
                .iter()
                .any(|open| open == "article" || open == "main");
            if is_noise_element(&tag, inside_content) {
                if !is_void {
                    skipping = Some((tag.name, 1));
                }
                continue;
            }
            if !is_void {
                open_tags.push(tag.name.clone());
            }
        }
        if BLOCK_TAGS.contains(&tag.name.as_str()) {
            raw.push('\n');
        } else {
            raw.push(' ');
        }
    }
    if skipping.is_none() && text_start < bytes.len() {
        push_text_segment(&mut raw, &html[text_start..]);
    }

    normalize_extracted_text(&raw)
}

// Gom khoảng trắng trong từng dòng, bỏ dòng rỗng và dòng trùng lặp (so khớp không dấu)
fn normalize_extracted_text(raw: &str) -> String {
    let mut seen = std::collections::HashSet::new();
    raw.lines()
        .map(|line| line.split_whitespace().collect::<Vec<_>>().join(" "))
        .filter(|line| !line.is_empty() && seen.insert(normalize_text(line)))
        .collect::<Vec<_>>()
        .join("\n")
}

fn extract_title(html: &str, fallback: &str) -> String {
    let title = find_ascii_ci(html, "<title", 0)
        .and_then(|start| html[start..].find('>').map(|end| start + end + 1))
        .and_then(|content_start| {
            find_ascii_ci(html, "</title", content_start)
                .map(|content_end| &html[content_start..content_end])
        })
        .map(|raw| {
            decode_html_entities(raw)
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default();
    if title.is_empty() {
        fallback.to_string()
    } else {
        title
    }
}

fn search_terms(query: &str) -> Vec<String> {
    const STOP_WORDS: &[&str] = &[
        "thi", "nam", "nao", "chung", "khi", "nao", "hoi", "cho", "toi", "tui", "minh", "thong",
        "tin", "ve", "cua", "truong", "dai", "hoc", "khong",
    ];

    let normalized = normalize_text(query);
    let mut terms = Vec::new();
    for term in normalized.split_whitespace() {
        let is_number = term.chars().all(|ch| ch.is_ascii_digit());
        if is_number || (term.len() >= 4 && !STOP_WORDS.contains(&term)) {
            let value = term.to_string();
            if !terms.contains(&value) {
                terms.push(value);
            }
        }
    }
    if terms.is_empty() {
        terms.push(normalized);
    }
    terms
}

fn score_block(block: &str, terms: &[String]) -> i64 {
    let normalized = normalize_text(block);
    terms
        .iter()
        .filter(|term| normalized.contains(term.as_str()))
        .map(|term| {
            if term.chars().all(|ch| ch.is_ascii_digit()) {
                8
            } else if term.len() >= 8 {
                4
            } else {
                2
            }
        })
        .sum()
}

fn compact_snippet(block: &str) -> String {
    let trimmed = block.trim();
    if trimmed.chars().count() <= 260 {
        return trimmed.to_string();
    }
    let shortened = trimmed.chars().take(257).collect::<String>();
    format!("{}...", shortened.trim_end())
}

// CA-093.02: điểm ưu tiên tiêu đề — chứa trọn cụm từ khóa > chứa đủ các từ > từng từ khớp
const TITLE_FULL_PHRASE_BONUS: i64 = 100;
const TITLE_ALL_TERMS_BONUS: i64 = 40;
const TITLE_TERM_BONUS: i64 = 6;

fn title_score(title: &str, query: &str, terms: &[String]) -> i64 {
    let normalized_title = normalize_text(title);
    let normalized_query = normalize_text(query);
    if !normalized_query.is_empty() && normalized_title.contains(&normalized_query) {
        return TITLE_FULL_PHRASE_BONUS;
    }
    let matched = terms
        .iter()
        .filter(|term| normalized_title.contains(term.as_str()))
        .count();
    if matched > 0 && matched == terms.len() {
        TITLE_ALL_TERMS_BONUS
    } else {
        matched as i64 * TITLE_TERM_BONUS
    }
}

// Tách khối câu: theo dòng, dấu "|"/"•" và dấu chấm kết câu (không cắt "15.08.2026" hay "v1.0")
fn split_text_blocks(text: &str) -> Vec<String> {
    let mut blocks = Vec::new();
    for segment in text.split(['\n', '|', '•']) {
        let mut current = String::new();
        let mut chars = segment.chars().peekable();
        while let Some(ch) = chars.next() {
            current.push(ch);
            if ch == '.' && chars.peek().is_none_or(|next| next.is_whitespace()) {
                blocks.push(current.trim().trim_end_matches('.').trim().to_string());
                current.clear();
            }
        }
        blocks.push(current.trim().to_string());
    }
    blocks.retain(|block| !block.is_empty());
    blocks
}

struct RankedSnippet {
    score: i64,
    result: PublicSearchResult,
}

fn find_snippets(
    text: &str,
    title: &str,
    source_url: &str,
    query: &str,
    terms: &[String],
) -> Vec<RankedSnippet> {
    let normalized_title = normalize_text(title);
    let page_bonus = title_score(title, query, terms);
    let mut scored = split_text_blocks(text)
        .into_iter()
        .filter(|block| block.chars().count() >= 24)
        // Bỏ khối chỉ lặp lại tiêu đề trang
        .filter(|block| normalize_text(block) != normalized_title)
        .filter_map(|block| {
            let score = score_block(&block, terms);
            (score > 0).then_some((score, block))
        })
        .collect::<Vec<_>>();

    scored.sort_by(|left, right| {
        right
            .0
            .cmp(&left.0)
            .then_with(|| left.1.len().cmp(&right.1.len()))
    });
    scored
        .into_iter()
        .take(3)
        .map(|(score, block)| RankedSnippet {
            score: score + page_bonus,
            result: PublicSearchResult {
                title: title.to_string(),
                snippet: compact_snippet(&block),
                source_url: source_url.to_string(),
            },
        })
        .collect()
}

fn https_host(url: &str) -> Option<String> {
    let without_scheme = url.strip_prefix("https://")?;
    let host_end = without_scheme
        .find(['/', '?', '#'])
        .unwrap_or(without_scheme.len());
    let host = without_scheme[..host_end].trim().to_ascii_lowercase();
    // Chặn userinfo/port/ký tự lạ để không lách allowlist bằng "a.edu.vn@evil.com"
    let valid = !host.is_empty()
        && host
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '.' || ch == '-');
    valid.then_some(host)
}

fn https_origin(url: &str) -> Option<String> {
    https_host(url).map(|host| format!("https://{}", host))
}

fn host_in_domains(host: &str, domains: &[&str]) -> bool {
    domains
        .iter()
        .any(|domain| host == *domain || host.ends_with(&format!(".{}", domain)))
}

// CA-093.02: chỉ cho phép URL HTTPS thuộc tên miền chính thống của các trường đã cấu hình
fn is_official_public_url(url: &str) -> bool {
    https_host(url).is_some_and(|host| {
        ALL_SOURCES
            .iter()
            .any(|source| host_in_domains(&host, source.domains))
    })
}

fn absolute_public_url(base_url: &str, href: &str) -> Option<String> {
    let href = decode_html_entities(href).trim().to_string();
    if href.is_empty()
        || href.starts_with('#')
        || href.starts_with("mailto:")
        || href.starts_with("tel:")
        || href.starts_with("javascript:")
        || href.starts_with("http://")
    {
        return None;
    }
    if href.starts_with("https://") {
        return Some(href.split('#').next().unwrap_or("").trim_end_matches('/').to_string());
    }

    let origin = https_origin(base_url)?;
    if href.starts_with('/') {
        return Some(format!("{}{}", origin, href.split('#').next().unwrap_or("")));
    }

    let base_path = base_url.rsplit_once('/').map(|(prefix, _)| prefix).unwrap_or(base_url);
    Some(format!(
        "{}/{}",
        base_path.trim_end_matches('/'),
        href.split('#').next().unwrap_or("")
    ))
}

fn is_allowed_source_url(source: &PublicSchoolSource, url: &str) -> bool {
    let Some(candidate_origin) = https_origin(url) else {
        return false;
    };
    let in_domains = https_host(url).is_some_and(|host| host_in_domains(&host, source.domains));
    in_domains
        && source
        .urls
        .iter()
        .filter_map(|allowed| https_origin(allowed))
        .any(|allowed_origin| allowed_origin == candidate_origin)
}

fn link_matches_terms(url: &str, terms: &[String]) -> bool {
    const SCHOOL_INFO_SLUGS: &[&str] = &[
        "tuyen-sinh",
        "tuyensinh",
        "nhap-hoc",
        "tan-sinh-vien",
        "dao-tao",
        "lich",
        "thong-bao",
        "quy-che",
        "hoc-phi",
    ];

    let normalized_url = normalize_text(url);
    SCHOOL_INFO_SLUGS
        .iter()
        .any(|slug| normalized_url.contains(slug))
        || terms
            .iter()
            .any(|term| term.len() >= 4 && normalized_url.contains(term.as_str()))
}

fn extract_candidate_links(
    html: &str,
    base_url: &str,
    source: &PublicSchoolSource,
    terms: &[String],
) -> Vec<String> {
    // to_ascii_lowercase giữ nguyên độ dài byte; to_lowercase có thể lệch index với ký tự Unicode (vd "İ")
    let lower = html.to_ascii_lowercase();
    let mut links = Vec::new();
    let mut cursor = 0;

    while let Some(offset) = lower[cursor..].find("href=") {
        let href_start = cursor + offset + "href=".len();
        let Some(quote) = html[href_start..].chars().next() else {
            break;
        };
        if quote != '"' && quote != '\'' {
            cursor = href_start;
            continue;
        }
        let value_start = href_start + quote.len_utf8();
        let Some(value_end_offset) = html[value_start..].find(quote) else {
            break;
        };
        let raw_href = &html[value_start..value_start + value_end_offset];
        if let Some(url) = absolute_public_url(base_url, raw_href) {
            if is_allowed_source_url(source, &url)
                && link_matches_terms(&url, terms)
                && !links.contains(&url)
            {
                links.push(url);
            }
        }
        if links.len() >= 10 {
            break;
        }
        cursor = value_start + value_end_offset + quote.len_utf8();
    }

    links
}

const MAX_RESPONSE_BYTES: u64 = 2 * 1024 * 1024; // 2MB max
// CA-093.01: hạn chót tổng cho cả lượt tìm kiếm, không phụ thuộc số trang crawl
const SEARCH_DEADLINE: Duration = Duration::from_secs(20);
const PER_REQUEST_TIMEOUT: Duration = Duration::from_secs(8);
// Ngưỡng thời gian còn lại tối thiểu để còn đáng gửi thêm request
const MIN_REQUEST_BUDGET: Duration = Duration::from_millis(200);
// 1 lần gọi đầu + tối đa 2 lần thử lại
const MAX_FETCH_ATTEMPTS: usize = 3;
const MAX_RESULTS: usize = 6;
// Gom thêm ứng viên trước khi xếp hạng để trang có tiêu đề khớp ở sau vẫn được đưa lên đầu
const MAX_RANKING_CANDIDATES: usize = 12;

fn fetch_public_page(url: &str, timeout: Duration) -> Result<String, String> {
    if !is_official_public_url(url) {
        return Err("Chi cho phep tra cuu nguon cong khai HTTPS thuoc ten mien chinh thong.".to_string());
    }

    let timeout = timeout.min(PER_REQUEST_TIMEOUT);
    let config = ureq::Agent::config_builder()
        .timeout_global(Some(timeout))
        .timeout_connect(Some(timeout.min(Duration::from_secs(3))))
        .timeout_recv_response(Some(timeout.min(Duration::from_secs(5))))
        .max_redirects(5)
        .build();
    let agent = ureq::Agent::new_with_config(config);

    let resp = agent
        .get(url)
        .header("User-Agent", "CampusAssistantLocal/1.0.1 public-search")
        .call()
        .map_err(|_| format!("Khong doc duoc nguon cong khai: {}", url))?;

    // CA-093.02: redirect ra ngoài allowlist (hoặc hạ xuống HTTP) bị loại, không đọc nội dung
    let final_url = resp.get_uri().to_string();
    if !is_official_public_url(&final_url) {
        return Err(format!("Nguon cong khai chuyen huong ra ngoai danh sach an toan: {}", url));
    }

    let mut reader = resp.into_body().into_reader().take(MAX_RESPONSE_BYTES);
    let mut html = String::new();
    reader
        .read_to_string(&mut html)
        .map_err(|_| format!("Nguon cong khai khong tra ve HTML hop le: {}", url))?;

    Ok(html)
}

enum FetchOutcome {
    Fetched(String),
    Failed,
    DeadlineReached,
}

// Thử tải một URL tối đa MAX_FETCH_ATTEMPTS lần, timeout mỗi lần không vượt thời gian còn lại
fn fetch_with_retry(
    url: &str,
    deadline: Instant,
    fetcher: &impl Fn(&str, Duration) -> Result<String, String>,
) -> FetchOutcome {
    for _ in 0..MAX_FETCH_ATTEMPTS {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining < MIN_REQUEST_BUDGET {
            return FetchOutcome::DeadlineReached;
        }
        if let Ok(html) = fetcher(url, remaining.min(PER_REQUEST_TIMEOUT)) {
            return FetchOutcome::Fetched(html);
        }
    }
    FetchOutcome::Failed
}

fn search_public_school_info_for_source(
    source: &'static PublicSchoolSource,
    query: &str,
    search_deadline: Duration,
    fetcher: impl Fn(&str, Duration) -> Result<String, String>,
) -> Result<PublicSearchResponse, String> {
    let query = sanitize_query(query)?;
    let terms = search_terms(&query);
    let deadline = Instant::now() + search_deadline;
    let mut ranked: Vec<RankedSnippet> = Vec::new();
    let mut seen_snippets = std::collections::HashSet::new();
    let mut searched_urls = Vec::new();
    let mut failed_urls = Vec::new();
    let mut fetched_count = 0;
    let mut timed_out = false;
    let mut pending_urls = source
        .urls
        .iter()
        .map(|url| (*url).to_string())
        .collect::<Vec<_>>();
    let mut cursor = 0;

    while cursor < pending_urls.len() && searched_urls.len() < 12 {
        let url = pending_urls[cursor].clone();
        cursor += 1;
        if searched_urls.contains(&url) {
            continue;
        }
        let html = match fetch_with_retry(&url, deadline, &fetcher) {
            FetchOutcome::Fetched(html) => html,
            FetchOutcome::Failed => {
                searched_urls.push(url.clone());
                failed_urls.push(url);
                continue;
            }
            FetchOutcome::DeadlineReached => {
                timed_out = true;
                break;
            }
        };
        searched_urls.push(url.clone());
        fetched_count += 1;

        for candidate in extract_candidate_links(&html, &url, source, &terms) {
            if !searched_urls.contains(&candidate) && !pending_urls.contains(&candidate) {
                pending_urls.push(candidate);
            }
        }

        let title = extract_title(&html, source.name);
        let text = strip_html_to_text(&html);
        for snippet in find_snippets(&text, &title, &url, &query, &terms) {
            // Bỏ nội dung trùng giữa các trang (menu/thông báo lặp lại)
            if seen_snippets.insert(normalize_text(&snippet.result.snippet)) {
                ranked.push(snippet);
            }
        }
        if ranked.len() >= MAX_RANKING_CANDIDATES {
            break;
        }
    }

    // CA-093.02: xếp hạng toàn bộ ứng viên; sort ổn định nên cùng điểm giữ thứ tự crawl
    ranked.sort_by(|left, right| right.score.cmp(&left.score));
    let results = ranked
        .into_iter()
        .take(MAX_RESULTS)
        .map(|snippet| snippet.result)
        .collect::<Vec<_>>();

    // DATA-001: chỉ báo "không tìm thấy" khi mọi nguồn đều đọc được và không bị cắt bởi hạn chót
    let status = if fetched_count == 0 {
        "error"
    } else if !failed_urls.is_empty() || timed_out {
        "partial"
    } else if results.is_empty() {
        "no_match"
    } else {
        "success"
    };

    let message = match status {
        "error" if timed_out && failed_urls.is_empty() => format!(
            "Het thoi gian cho nguon cong khai cua {}. Chua doc duoc trang nao.",
            source.name
        ),
        "error" => format!(
            "Mat ket noi toi nguon tai lieu cong khai cua {}. Khong doc duoc trang nao.",
            source.name
        ),
        "partial" => format!(
            "Chi doc duoc mot phan nguon cong khai cua {}; tim thay {} ket qua voi \"{}\".",
            source.name,
            results.len(),
            query
        ),
        "no_match" => format!(
            "Khong tim thay tu khoa \"{}\" trong cac trang cong khai da cau hinh cho {}.",
            query, source.name
        ),
        _ => format!(
            "Tim thay {} ket qua cong khai phu hop voi \"{}\" tren nguon cua {}.",
            results.len(),
            query,
            source.name
        ),
    };

    Ok(PublicSearchResponse {
        school_id: source.id.to_string(),
        school_name: source.name.to_string(),
        query,
        searched_urls,
        results,
        message,
        status: status.to_string(),
        failed_urls,
        timed_out,
    })
}

// CA-093.01: chạy crawl trên thread blocking riêng để không giữ main thread/UI trong lúc chờ mạng
#[tauri::command]
pub(crate) async fn search_public_school_info(
    school_id: String,
    query: String,
) -> Result<PublicSearchResponse, String> {
    let source = source_for_school(school_id.trim())
        .ok_or_else(|| "Truong nay chua co connector nguon cong khai.".to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        search_public_school_info_for_source(source, &query, SEARCH_DEADLINE, fetch_public_page)
    })
    .await
    .map_err(|_| "Tac vu tra cuu cong khai bi dung bat thuong.".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SOURCE: PublicSchoolSource = PublicSchoolSource {
        id: "test",
        name: "Test University",
        urls: &["https://example.edu/news"],
        domains: &["example.edu"],
    };

    const TEST_DEADLINE: Duration = Duration::from_secs(5);

    #[test]
    fn strip_html_to_text_keeps_public_content() {
        let text = strip_html_to_text(
            "<html><title>UTH</title><body><h1>Tuyen sinh 2026</h1></body></html>",
        );
        assert!(normalize_text(&text).contains("tuyen sinh 2026"));
    }

    #[test]
    fn search_public_school_info_matches_keyword_from_public_page() {
        let response =
            search_public_school_info_for_source(&TEST_SOURCE, "2008 nhập học", TEST_DEADLINE, |_, _| {
                Ok("<title>Tuyen sinh</title><p>Thong tin tuyen sinh 2026 danh cho thi sinh sinh nam 2008 va xac nhan nhap hoc truc tuyen.</p>".to_string())
            })
            .unwrap();

        assert_eq!(response.results.len(), 1);
        assert!(response.results[0].snippet.contains("2008"));
    }

    #[test]
    fn search_public_school_info_returns_empty_when_keyword_is_absent() {
        let response = search_public_school_info_for_source(&TEST_SOURCE, "2008", TEST_DEADLINE, |_, _| {
            Ok("<title>Tuyen sinh</title><p>Thong tin chung ve nha truong.</p>".to_string())
        })
        .unwrap();

        assert!(response.results.is_empty());
        assert!(response.message.contains("Khong tim thay"));
        assert_eq!(response.status, "no_match");
        assert!(response.failed_urls.is_empty());
    }

    // CA-093.01: mọi nguồn lỗi phải trả status error, không được giả làm no-match
    #[test]
    fn search_public_school_info_reports_error_when_all_fetches_fail() {
        let response = search_public_school_info_for_source(&TEST_SOURCE, "tuyen sinh", TEST_DEADLINE, |_, _| {
            Err("network down".to_string())
        })
        .unwrap();

        assert_eq!(response.status, "error");
        assert!(response.results.is_empty());
        assert!(!response.message.contains("Khong tim thay"));
        assert!(response.message.contains("Mat ket noi"));
        assert_eq!(response.failed_urls, vec!["https://example.edu/news".to_string()]);
    }

    #[test]
    fn search_public_school_info_retries_at_most_two_times_per_url() {
        let attempts = std::cell::Cell::new(0);
        let response = search_public_school_info_for_source(&TEST_SOURCE, "tuyen sinh", TEST_DEADLINE, |_, _| {
            attempts.set(attempts.get() + 1);
            Err("timeout".to_string())
        })
        .unwrap();

        assert_eq!(attempts.get(), 3); // 1 lần đầu + 2 lần thử lại
        assert_eq!(response.status, "error");
    }

    #[test]
    fn search_public_school_info_recovers_when_retry_succeeds() {
        let attempts = std::cell::Cell::new(0);
        let response = search_public_school_info_for_source(&TEST_SOURCE, "2008", TEST_DEADLINE, |_, _| {
            attempts.set(attempts.get() + 1);
            if attempts.get() < 3 {
                Err("flaky".to_string())
            } else {
                Ok("<title>Tuyen sinh</title><p>Thi sinh sinh nam 2008 xem lich nhap hoc tren trang tuyen sinh.</p>".to_string())
            }
        })
        .unwrap();

        assert_eq!(response.status, "success");
        assert_eq!(response.results.len(), 1);
        assert!(response.failed_urls.is_empty());
    }

    #[test]
    fn search_public_school_info_marks_partial_and_keeps_original_urls() {
        const MULTI_SOURCE: PublicSchoolSource = PublicSchoolSource {
            id: "multi",
            name: "Multi University",
            urls: &["https://a.example.edu/", "https://b.example.edu/tuyen-sinh"],
            domains: &["example.edu"],
        };

        let response = search_public_school_info_for_source(&MULTI_SOURCE, "2008", TEST_DEADLINE, |url, _| match url {
            "https://a.example.edu/" => Err("dns".to_string()),
            _ => Ok("<title>TS</title><p>Thi sinh sinh nam 2008 xem lich nhap hoc tren trang tuyen sinh.</p>".to_string()),
        })
        .unwrap();

        assert_eq!(response.status, "partial");
        assert_eq!(response.failed_urls, vec!["https://a.example.edu/".to_string()]);
        assert_eq!(response.results[0].source_url, "https://b.example.edu/tuyen-sinh");
        assert!(response.searched_urls.contains(&"https://a.example.edu/".to_string()));
    }

    #[test]
    fn search_public_school_info_stops_at_overall_deadline() {
        let calls = std::cell::Cell::new(0);
        let response = search_public_school_info_for_source(&TEST_SOURCE, "tuyen sinh", Duration::ZERO, |_, _| {
            calls.set(calls.get() + 1);
            Ok(String::new())
        })
        .unwrap();

        assert_eq!(calls.get(), 0);
        assert!(response.timed_out);
        assert_eq!(response.status, "error");
        assert!(!response.message.contains("Khong tim thay"));
    }

    #[test]
    fn search_public_school_info_passes_bounded_timeout_to_fetcher() {
        let max_seen = std::cell::Cell::new(Duration::ZERO);
        search_public_school_info_for_source(&TEST_SOURCE, "tuyen sinh", Duration::from_secs(60), |_, timeout| {
            max_seen.set(max_seen.get().max(timeout));
            Err("down".to_string())
        })
        .unwrap();

        assert!(max_seen.get() <= PER_REQUEST_TIMEOUT);
    }

    #[test]
    fn source_for_school_supports_multiple_public_school_ids() {
        assert_eq!(source_for_school("uth").unwrap().id, "uth");
        assert_eq!(source_for_school("hcmut").unwrap().id, "hcmut");
        assert_eq!(source_for_school("hcmus").unwrap().id, "hcmus");
        assert_eq!(source_for_school("hcmue").unwrap().id, "hcmue");
    }

    #[test]
    fn search_public_school_info_crawls_relevant_allowlisted_links() {
        const CRAWL_SOURCE: PublicSchoolSource = PublicSchoolSource {
            id: "crawl",
            name: "Crawl University",
            urls: &["https://example.edu/"],
            domains: &["example.edu"],
        };

        let response =
            search_public_school_info_for_source(&CRAWL_SOURCE, "2008 nhập học", TEST_DEADLINE, |url, _| {
                match url {
                    "https://example.edu/" => Ok(
                        r#"<html><body><a href="/tuyen-sinh-2026">Tuyen sinh</a></body></html>"#
                            .to_string(),
                    ),
                    "https://example.edu/tuyen-sinh-2026" => Ok("<title>Tuyen sinh 2026</title><p>Thi sinh sinh nam 2008 xem thu tuc xac nhan nhap hoc nam 2026 tai cong thong tin cong khai.</p>".to_string()),
                    _ => Err("unexpected url".to_string()),
                }
            })
            .unwrap();

        assert!(response
            .searched_urls
            .contains(&"https://example.edu/tuyen-sinh-2026".to_string()));
        assert_eq!(response.results.len(), 1);
        assert!(response.results[0].snippet.contains("2008"));
    }

    // CA-093.02: fixture HTML phức tạp nằm ở tests/fixtures/search/
    const COMPLEX_ARTICLE: &str = include_str!("../../tests/fixtures/search/complex_article.html");
    const RANKING_HOME: &str = include_str!("../../tests/fixtures/search/ranking_home.html");
    const RANKING_GENERAL: &str = include_str!("../../tests/fixtures/search/ranking_general.html");
    const RANKING_TITLE_MATCH: &str =
        include_str!("../../tests/fixtures/search/ranking_title_match.html");
    const MALFORMED_UNICODE: &str =
        include_str!("../../tests/fixtures/search/malformed_unicode.html");

    #[test]
    fn parser_removes_script_style_nav_ads_and_hidden_elements() {
        let text = strip_html_to_text(COMPLEX_ARTICLE);

        assert!(!text.contains("NOISE_"), "con noi dung rac:\n{}", text);
        assert!(!text.contains('<') && !text.contains("&amp;") && !text.contains("&#"));
        assert!(text.contains("Hồ sơ nhập học gồm: giấy báo trúng tuyển, học bạ THPT & bản sao giấy khai sinh."));
        assert!(text.contains("Học phí năm học 2026–2027 được công bố tại mục \"Học phí\" — xem chi tiết bên dưới."));
        // Tiêu đề bài viết nằm trong <article><header> vẫn được giữ
        assert!(text.contains("Hướng dẫn nhập học 2026 – Trường Đại học Giao thông vận tải TP.HCM"));
    }

    #[test]
    fn parser_collapses_whitespace_and_removes_duplicate_content() {
        let text = strip_html_to_text(COMPLEX_ARTICLE);

        assert!(text.contains("Thí sinh trúng tuyển sinh năm 2008 thực hiện xác nhận nhập học trực tuyến từ ngày"));
        assert_eq!(text.matches("xác nhận nhập học trực tuyến").count(), 1);
        assert!(text.lines().all(|line| line == line.trim() && !line.contains("  ") && !line.is_empty()));
    }

    #[test]
    fn search_snippets_from_complex_page_are_clean_and_skip_title_duplicate() {
        let response =
            search_public_school_info_for_source(&TEST_SOURCE, "2008 nhập học", TEST_DEADLINE, |_, _| {
                Ok(COMPLEX_ARTICLE.to_string())
            })
            .unwrap();

        assert_eq!(response.status, "success");
        assert_eq!(response.results[0].title, "Hướng dẫn nhập học 2026 – Trường Đại học Giao thông vận tải TP.HCM");
        assert!(response.results[0].snippet.contains("sinh năm 2008"));
        for result in &response.results {
            assert!(!result.snippet.contains("NOISE_") && !result.snippet.contains('<'));
            assert_ne!(normalize_text(&result.snippet), normalize_text(&result.title));
        }
        // Ngày dạng 15.08.2026 không bị cắt đôi khi tách câu
        assert!(split_text_blocks("Đăng ngày 15.08.2026 bởi Phòng Đào tạo. Câu sau.")
            .contains(&"Đăng ngày 15.08.2026 bởi Phòng Đào tạo".to_string()));
    }

    #[test]
    fn ranking_puts_full_keyword_title_first_even_when_crawled_last() {
        const RANK_SOURCE: PublicSchoolSource = PublicSchoolSource {
            id: "rank",
            name: "Rank University",
            urls: &["https://example.edu/"],
            domains: &["example.edu"],
        };

        let response =
            search_public_school_info_for_source(&RANK_SOURCE, "thủ tục nhập học", TEST_DEADLINE, |url, _| {
                match url {
                    "https://example.edu/" => Ok(RANKING_HOME.to_string()),
                    "https://example.edu/tin-tuc/thong-bao-chung" => Ok(RANKING_GENERAL.to_string()),
                    "https://example.edu/tuyen-sinh/huong-dan-nhap-hoc" => Ok(RANKING_TITLE_MATCH.to_string()),
                    other => Err(format!("unexpected url {}", other)),
                }
            })
            .unwrap();

        assert_eq!(response.status, "success");
        assert_eq!(response.searched_urls.len(), 3);
        assert_eq!(response.results.len(), 3);
        assert_eq!(response.results[0].source_url, "https://example.edu/tuyen-sinh/huong-dan-nhap-hoc");
        assert_eq!(response.results[0].title, "Hướng dẫn thủ tục nhập học tân sinh viên K26");
        // Cùng điểm thì giữ thứ tự crawl
        assert_eq!(response.results[1].source_url, "https://example.edu/");
        assert_eq!(response.results[2].source_url, "https://example.edu/tin-tuc/thong-bao-chung");
    }

    #[test]
    fn title_score_prefers_full_phrase_over_partial_terms() {
        let terms = search_terms("thủ tục nhập học");
        let full = title_score("Hướng dẫn thủ tục nhập học K26", "thủ tục nhập học", &terms);
        let partial = title_score("Lịch nhập học", "thủ tục nhập học", &terms);
        let none = title_score("Thông báo chung", "thủ tục nhập học", &terms);
        assert!(full > partial && partial > none);
        assert_eq!(full, TITLE_FULL_PHRASE_BONUS);
    }

    #[test]
    fn crawler_skips_links_outside_domain_allowlist() {
        const RANK_SOURCE: PublicSchoolSource = PublicSchoolSource {
            id: "rank",
            name: "Rank University",
            urls: &["https://example.edu/"],
            domains: &["example.edu"],
        };
        let links = extract_candidate_links(RANKING_HOME, "https://example.edu/", &RANK_SOURCE, &search_terms("tuyển sinh"));

        assert!(links.iter().all(|link| link.starts_with("https://example.edu/")));
        assert!(!links.iter().any(|link| link.contains("evil") || link.contains("attacker") || link.contains("http://")));
    }

    #[test]
    fn official_url_allowlist_rejects_spoofed_hosts() {
        assert!(is_official_public_url("https://uth.edu.vn/tin-tuc"));
        assert!(is_official_public_url("https://tuyensinh.ut.edu.vn/"));
        assert!(is_official_public_url("https://aao.hcmut.edu.vn?x=1"));
        assert!(!is_official_public_url("http://uth.edu.vn/"));
        assert!(!is_official_public_url("https://uth.edu.vn.evil.com/"));
        assert!(!is_official_public_url("https://notuth.edu.vn/"));
        assert!(!is_official_public_url("https://evil.com/uth.edu.vn"));
        assert!(!is_official_public_url("https://uth.edu.vn@evil.com/"));
        assert!(!is_official_public_url("https://evil.com@uth.edu.vn/"));
        assert!(!is_official_public_url("https://uth.edu.vn:8443/"));
    }

    #[test]
    fn configured_sources_only_use_official_edu_domains() {
        for source in ALL_SOURCES {
            assert!(source.domains.iter().all(|domain| domain.ends_with(".edu.vn")), "{}", source.id);
            for url in source.urls {
                assert!(is_official_public_url(url), "{}", url);
                assert!(is_allowed_source_url(source, url), "{}", url);
            }
        }
    }

    #[test]
    fn real_fetcher_rejects_non_allowlisted_url_before_network() {
        let error = fetch_public_page("https://example.com/", Duration::from_millis(1)).unwrap_err();
        assert!(error.contains("ten mien chinh thong"));
    }

    #[test]
    fn parser_handles_malformed_uppercase_and_unicode_html_without_panic() {
        let text = strip_html_to_text(MALFORMED_UNICODE);

        assert!(!text.contains("NOISE_"));
        assert!(text.contains("Lịch thi học kỳ 1 năm 2026 dành cho sinh viên khóa K25 được công bố ngày 01.12.2026"));
        assert!(text.contains("Điểm thi < 5 sẽ phải thi lại"));
        assert!(text.contains('\u{FFFD}') && text.contains("&unknown;") && text.contains("&lt; vẫn"));
        assert_eq!(extract_title(MALFORMED_UNICODE, "fallback"), "Lịch thi İSTANBUL & ĐÀ LẠT");

        let links = extract_candidate_links(MALFORMED_UNICODE, "https://example.edu/", &TEST_SOURCE, &search_terms("lịch thi"));
        assert!(links.contains(&"https://example.edu/lich-thi?ky=1&nam=2026".to_string()));
    }
}
