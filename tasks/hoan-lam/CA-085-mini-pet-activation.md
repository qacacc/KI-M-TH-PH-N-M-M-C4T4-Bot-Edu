# CA-085 - Mini pet (hoãn làm)

- Status: Frozen / Activation-only
- Created: 2026-10-09
- Owner: User approval required
- Activation rule: Chỉ bắt đầu khi user yêu cầu rõ kích hoạt mini pet hoặc CA-085.

## Yêu cầu đã ghi nhận

Lưu ý tưởng mini pet vào nhóm hoãn làm, tách khỏi hoàn thiện core và connector trường. Chưa chốt thiết kế, asset, tương tác hay tiến triển; không tự suy đoán hoặc triển khai.

## Không làm khi còn Frozen

- Không thêm mascot/pet runtime, animation hoặc dependency.
- Không thêm nút/sidebar quảng cáo tính năng đã dùng được.
- Không tự liên kết XP/coin/reward hoặc thay đổi SQLite.
- Không tạo ảnh/asset hay gọi dịch vụ ngoài chỉ vì task này tồn tại.

## Điều kiện bắt đầu sau này

User kích hoạt rõ -> chốt scope/thiết kế/dữ liệu/asset -> phân tích tác động -> triển khai và kiểm thử. Chuyển file vào hoan-lam không phải kích hoạt hoặc hoàn thành chức năng.

CA-064 Reward/Minigame là task riêng; kích hoạt một task không tự kích hoạt task còn lại.
