# Acceptance Criteria

v1.0.1 duoc xem la hoan thanh khi:

1. Nhap `tim tai lieu lap trinh mang` nhan dung intent `FIND_DOCUMENTS`.
2. He thong nhan dien duoc mon `Lap trinh mang`.
3. Neu thieu hoc ky, bot hoi hoc ky dung mot lan.
4. Nhap `hoc ky 1` tiep tuc dung flow cu.
5. Danh sach hien thi dung du lieu JSON local.
6. Chon file khong mo/copy ngay.
7. He thong yeu cau xac nhan truoc khi mo/copy.
8. File chi duoc mo hoac copy trong vung quan ly.
9. Duong dan chua `../` hoac thoat khoi vung quan ly bi tu choi.
10. File khong ton tai tao loi than thien, khong hien stack trace.
11. Action log ghi metadata hanh dong va ket qua.
12. Action log khong ghi noi dung file, token, mat khau, cookie hoac secret.
13. Khoi dong lai ung dung van giu theme, nhung khong khoi phuc noi dung chat cu.
14. `npm run check:all` pass, bao gom test TypeScript, build frontend, Rust check, Rust test va npm audit.
15. Tab Nhat ky chi hien thi metadata: action, documentId, result, errorCode va createdAt.
16. Lenh `/help` hien dung danh sach lenh nhanh, va `/clear` xoa noi dung chat dang hien thi trong phien hien tai.
17. Khi bot dang hoi hoc ky, nhap `1` van tiep tuc dung flow nhu `hoc ky 1`.
18. Khi bot dang cho xac nhan file, nhap `xac nhan` thuc hien thao tac va nhap `huy` se huy thao tac.
19. Khi danh sach file da hien thi, nhap `mo 1` hoac `copy 2` se tao buoc xac nhan cho dung file theo so thu tu.
20. Khi dang trong luong tai lieu, nhap `huy` thoat luong hien tai va nhap `quay lai` tu danh sach file quay ve buoc chon hoc ky.
21. Trang File mau va Nhat ky co the tim kiem, loc, sap xep metadata va hien thong ke nhanh tinh tu du lieu local/log that.
22. Nhap `xem thong bao` nhan dung intent `FIND_ANNOUNCEMENTS` va hien bang thong bao mau local.
23. Nhap `xem lich hoc hoc ky 1` nhan dung intent `FIND_SCHEDULE` va hien bang lich hoc mau local.
24. Nhap `xem lich thi hk 1` nhan dung intent `FIND_EXAMS` va hien bang lich thi mau local.
25. Slash commands `/announcements`, `/schedule`, `/exams` hoat dong va khong goi mang.
26. Dashboard hien dung so luong thong bao, lich hoc va lich thi tu bootstrap local.
27. Version package, Tauri config va Cargo crate la `1.0.1`.
28. Slash command `/storage` mo tab Bo nho.
29. Tab Bo nho hien so file/dung luong file mau, downloads va so action log tu du lieu local that.
30. Nut mo downloads chi mo thu muc `Documents/CampusAssistant/downloads`.
31. Xoa action log can confirm va khong xoa file tai lieu/downloads.
32. Slash command `/health` va `/check` mo tab Kiem tra.
33. Tab Kiem tra hien PASS/WARN/FAIL cho SQLite, file mau, downloads, JSON local va cau hinh update.
34. Health report khong goi mang va khong doc ngoai vung CampusAssistant.
35. Nut xuat bao cao tao file JSON trong `Documents/CampusAssistant/downloads`.
36. Diagnostic report khong chua noi dung chat, noi dung tai lieu, token, secret hoac raw credential.
37. Sau khi xuat bao cao, action log ghi `EXPORT_DIAGNOSTIC_REPORT`.
38. Slash command `/release` va `/about` mo tab Phat hanh.
39. Tab Phat hanh hien checklist release local-first va khong yeu cau connector truong that.
40. Installer NSIS va MSI duoc build voi version `1.0.1`.
41. Slash command `/appearance` va `/theme` mo tab Giao dien.
42. Giao dien cho phep tuy bien mau, font, density va anh nen local.
43. Layout chinh la split-view gom sidebar hover rail, noi dung chinh, utility panel va customize panel; panel phu co the resize/collapse va khoi phuc.
44. Appearance settings duoc luu local va ap dung lai khi mo app.
45. Rust health test khong dung truc tiep AppLocalData/SQLite that cua nguoi dung.
46. `npm run check:all` pass trong moi truong day du quyen npm audit.
47. Rust test tu choi cac input path traversal pho bien: `../outside.txt`, `folder/../../outside.txt`, `..\outside.txt`, absolute path va UNC path.
48. Rust test xac nhan open/copy file loi khong ghi action log thanh cong gia.
49. Rust test symlink escape bi chan khi moi truong ho tro tao symlink.
50. Rust test DB seed idempotent va khong ghi de setting nguoi dung da doi.
51. Sidebar trai mac dinh gon nhu rail, khi hover/focus moi hien day du nhan va nhom menu.
52. Noi dung chinh khong bi ep vao cot hep khi sidebar dang collapsed; title va noi dung khong xuong tung ky tu.
53. Khi vao tab Giao dien, customize panel ben phai tu an de khong co hai khu tuy bien mo song song.
54. Giao dien co preset, opacity panel, fit/focus anh nen va overlay nen, tat ca thay doi qua draft/apply/discard/reset.
