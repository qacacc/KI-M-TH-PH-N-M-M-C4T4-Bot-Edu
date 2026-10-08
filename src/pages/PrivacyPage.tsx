export function PrivacyPage() {
  return (
    <div className="page-card">
      <h2>Cam kết v1.0.1</h2>
      <ul>
        <li>Không sử dụng Ollama, OpenAI API, RAG, embedding hoặc mô hình AI.</li>
        <li>Không gửi hội thoại, tài liệu hoặc dữ liệu cá nhân đến máy chủ bên ngoài.</li>
        <li>Không nhận đường dẫn file trực tiếp từ người dùng để thao tác hệ thống file.</li>
        <li>Action log chỉ ghi metadata: hành động, documentId, kết quả và thời gian.</li>
        <li>File chỉ được mở hoặc copy sau khi người dùng xác nhận.</li>
        <li>Hồ sơ trường local chỉ lưu tên trường, chế độ dùng và thông tin sinh viên người dùng tự nhập trên máy.</li>
        <li>Hồ sơ trường local không phải token, cookie, mật khẩu hoặc phiên đăng nhập trường.</li>
        <li>Chưa có đăng nhập SSO/API trường thật trong runtime v1.0.1.</li>
        <li>Nếu sau này thêm connector trường, token/cookie chỉ được lưu local sau consent và vault policy riêng.</li>
      </ul>
    </div>
  );
}
