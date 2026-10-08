# CA-064 - Special Activation Task: Reward & Minigame

## Trang thai

- Status: Frozen / Activation-only
- Owner: User approval required
- Created: 2026-07-28
- Activation rule: Chi duoc mo task nay khi user noi ro: "kich hoat CA-064" hoac "bat dau lam reward va minigame".

## Muc tieu duy nhat

Ghi lai dinh huong chuc nang **Reward** va **Minigame hoc tap** cho Campus Assistant. Task nay chi la task dac biet de giu y tuong, khong duoc tu dong trien khai.

## Pham vi chinh

Chi bao gom:

- Reward local-first.
- XP / coin / sao.
- Streak hoc tap.
- Daily tasks.
- Minigame hoc tap.
- Lien ket minigame voi reward.

## Khong thuoc scope CA-064

- Khong lam lai sidebar.
- Khong them mascot runtime.
- Khong them animation mascot.
- Khong khoa/mo khoa theme that.
- Khong thay doi Appearance Studio.
- Khong them marketplace/theme store.
- Khong thay doi navigation tong the.

Nhung phan tren neu can lam thi phai tao task rieng sau khi user yeu cau.

## Reward system

Reward nen local-first, khong can server.

Nen co:

- XP.
- Coin / sao.
- Streak hoc tap.
- Daily tasks.
- Lich su nhan thuong metadata.

Khong nen thuong cho hanh vi spam, vi du gui nhieu tin chat de lay diem.

Nguon diem hop ly:

- Dang nhap hom nay: XP nho.
- Xem lich hoc hom nay.
- Hoan thanh quiz.
- Hoan thanh flashcard.
- Giu streak nhieu ngay.
- Hoan thanh daily challenge.

## Minigame

Minigame khong nen la game rieng le vo nghia. Nen gan voi hoc tap.

Loai minigame nen lam sau:

- Quiz nhanh.
- Flashcard.
- Speed Match ghep khai niem.
- Daily Challenge.

AI sinh cau hoi tu tai lieu la feature rieng, khong trien khai chung voi MVP minigame dau tien.

## Vong lap chuc nang mong muon

```text
Hoc tap / Tra cuu
-> Minigame hoc tap
-> XP / Coin / Streak
-> Dong luc quay lai hoc tap
```

## Thu tu trien khai khi duoc kich hoat

1. Tao task con `CA-064A-reward-data-contract.md`.
2. Tao task con `CA-064B-reward-local-engine.md`.
3. Tao task con `CA-064C-reward-page.md`.
4. Tao task con `CA-064D-minigame-first-slice.md`.
5. Tao task con `CA-064E-minigame-reward-link.md`.

## Khong duoc lam khi task chua kich hoat

- Khong them reward schema.
- Khong them bang SQLite reward.
- Khong them minigame UI.
- Khong them diem/XP vao chat flow.
- Khong them task daily vao runtime.
- Khong them dependency game/animation.
- Khong thay doi App navigation.

## Khi kich hoat phai lam gi truoc

Truoc khi code, AI bat buoc:

1. Doc task nay.
2. Tao task con dau tien, thuong la `CA-064A-reward-data-contract.md`.
3. Neu can database, phai neu ro schema/migration truoc.
4. Neu can UI, phai neu ro vi tri hien thi va manual verification.
5. Xin user duyet ke hoach truoc khi sua code.

## Tieu chi nghiem thu sau nay

- Reward khong khuyen khich spam.
- Reward chi luu metadata local an toan.
- Minigame lien quan hoc tap.
- Sync/test failure khong xoa diem da co.
- Neu co SQLite schema moi thi phai co migration/test.
- `npm run check:all` pass voi moi task con.
