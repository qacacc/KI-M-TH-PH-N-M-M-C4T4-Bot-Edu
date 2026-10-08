use crate::models::{PublicSearchResponse, PublicSearchResult};
use std::io::Read;
use std::time::Duration;

struct PublicSchoolSource {
    id: &'static str,
    name: &'static str,
    urls: &'static [&'static str],
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
};

const HCMUT_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmut",
    name: "Truong Dai hoc Bach khoa - DHQG-HCM",
    urls: HCMUT_PUBLIC_URLS,
};

const HCMUS_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmus",
    name: "Truong Dai hoc Khoa hoc Tu nhien - DHQG-HCM",
    urls: HCMUS_PUBLIC_URLS,
};

const HCMUE_SOURCE: PublicSchoolSource = PublicSchoolSource {
    id: "hcmue",
    name: "Truong Dai hoc Su pham TP.HCM",
    urls: HCMUE_PUBLIC_URLS,
};

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
    input
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}

fn strip_html_to_text(html: &str) -> String {
    let mut text = String::with_capacity(html.len().min(64_000));
    let mut in_tag = false;
    let mut last_was_space = false;

    for ch in html.chars() {
        match ch {
            '<' => {
                in_tag = true;
                if !last_was_space {
                    text.push(' ');
                    last_was_space = true;
                }
            }
            '>' => in_tag = false,
            _ if in_tag => {}
            _ if ch.is_whitespace() => {
                if !last_was_space {
                    text.push(' ');
                    last_was_space = true;
                }
            }
            _ => {
                text.push(ch);
                last_was_space = false;
            }
        }
    }

    decode_html_entities(&text)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn extract_title(html: &str, fallback: &str) -> String {
    let lower = html.to_lowercase();
    let Some(start) = lower.find("<title>") else {
        return fallback.to_string();
    };
    let title_start = start + "<title>".len();
    let Some(end) = lower[title_start..].find("</title>") else {
        return fallback.to_string();
    };
    let raw = &html[title_start..title_start + end];
    strip_html_to_text(raw).trim().to_string()
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

fn find_snippets(
    text: &str,
    title: &str,
    source_url: &str,
    terms: &[String],
) -> Vec<PublicSearchResult> {
    let mut scored = text
        .split(['.', '\n', '|', '•'])
        .map(str::trim)
        .filter(|block| block.chars().count() >= 24)
        .filter_map(|block| {
            let score = score_block(block, terms);
            (score > 0).then(|| (score, block.to_string()))
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
        .map(|(_, block)| PublicSearchResult {
            title: title.to_string(),
            snippet: compact_snippet(&block),
            source_url: source_url.to_string(),
        })
        .collect()
}

fn https_origin(url: &str) -> Option<String> {
    if !url.starts_with("https://") {
        return None;
    }
    let without_scheme = &url["https://".len()..];
    let host_end = without_scheme.find('/').unwrap_or(without_scheme.len());
    let host = without_scheme[..host_end].trim().to_lowercase();
    if host.is_empty() {
        None
    } else {
        Some(format!("https://{}", host))
    }
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
    source
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
    let lower = html.to_lowercase();
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

fn fetch_public_page(url: &str) -> Result<String, String> {
    if !url.starts_with("https://") {
        return Err("Chi cho phep tra cuu nguon cong khai HTTPS.".to_string());
    }

    let config = ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(8)))
        .timeout_connect(Some(Duration::from_secs(3)))
        .timeout_recv_response(Some(Duration::from_secs(5)))
        .build();
    let agent = ureq::Agent::new_with_config(config);

    let resp = agent
        .get(url)
        .header("User-Agent", "CampusAssistantLocal/1.0.1 public-search")
        .call()
        .map_err(|_| format!("Khong doc duoc nguon cong khai: {}", url))?;

    let mut reader = resp.into_body().into_reader().take(MAX_RESPONSE_BYTES);
    let mut html = String::new();
    reader
        .read_to_string(&mut html)
        .map_err(|_| format!("Nguon cong khai khong tra ve HTML hop le: {}", url))?;

    Ok(html)
}

fn search_public_school_info_for_source(
    source: &'static PublicSchoolSource,
    query: &str,
    fetcher: impl Fn(&str) -> Result<String, String>,
) -> Result<PublicSearchResponse, String> {
    let query = sanitize_query(query)?;
    let terms = search_terms(&query);
    let mut results = Vec::new();
    let mut searched_urls = Vec::new();
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
        searched_urls.push(url.clone());
        let Ok(html) = fetcher(&url) else {
            continue;
        };

        for candidate in extract_candidate_links(&html, &url, source, &terms) {
            if !searched_urls.contains(&candidate) && !pending_urls.contains(&candidate) {
                pending_urls.push(candidate);
            }
        }

        let title = extract_title(&html, source.name);
        let text = strip_html_to_text(&html);
        results.extend(find_snippets(&text, &title, &url, &terms));
        if results.len() >= 6 {
            results.truncate(6);
            break;
        }
    }

    let message = if results.is_empty() {
        format!(
            "Khong tim thay tu khoa \"{}\" trong cac trang cong khai da cau hinh cho {}.",
            query, source.name
        )
    } else {
        format!(
            "Tim thay {} ket qua cong khai phu hop voi \"{}\" tren nguon cua {}.",
            results.len(),
            query,
            source.name
        )
    };

    Ok(PublicSearchResponse {
        school_id: source.id.to_string(),
        school_name: source.name.to_string(),
        query,
        searched_urls,
        results,
        message,
    })
}

#[tauri::command]
pub(crate) fn search_public_school_info(
    school_id: String,
    query: String,
) -> Result<PublicSearchResponse, String> {
    let source = source_for_school(school_id.trim())
        .ok_or_else(|| "Truong nay chua co connector nguon cong khai.".to_string())?;
    search_public_school_info_for_source(source, &query, fetch_public_page)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SOURCE: PublicSchoolSource = PublicSchoolSource {
        id: "test",
        name: "Test University",
        urls: &["https://example.edu/news"],
    };

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
            search_public_school_info_for_source(&TEST_SOURCE, "2008 nhập học", |_| {
                Ok("<title>Tuyen sinh</title><p>Thong tin tuyen sinh 2026 danh cho thi sinh sinh nam 2008 va xac nhan nhap hoc truc tuyen.</p>".to_string())
            })
            .unwrap();

        assert_eq!(response.results.len(), 1);
        assert!(response.results[0].snippet.contains("2008"));
    }

    #[test]
    fn search_public_school_info_returns_empty_when_keyword_is_absent() {
        let response = search_public_school_info_for_source(&TEST_SOURCE, "2008", |_| {
            Ok("<title>Tuyen sinh</title><p>Thong tin chung ve nha truong.</p>".to_string())
        })
        .unwrap();

        assert!(response.results.is_empty());
        assert!(response.message.contains("Khong tim thay"));
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
        };

        let response =
            search_public_school_info_for_source(&CRAWL_SOURCE, "2008 nhập học", |url| {
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
}
