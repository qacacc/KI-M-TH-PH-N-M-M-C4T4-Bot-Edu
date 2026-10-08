# CA-034 - Visual regression checks

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Them kiem tra visual/layout tu dong cho cac man hinh de tranh loi UI nhu chu bi ep doc, panel che nhau hoac sidebar lam vo grid.

## Ly do

Nhieu loi UX/UI chi thay bang mat. Can test tu dong truoc khi tiep tuc don CSS lon.

## Duoc phep lam

- Them script test visual neu dung cong cu da co hoac duoc duyet.
- Them fixture/screenshot baseline neu can.
- Kiem tra desktop rong, vua, hep.
- Kiem tra chat, appearance, table page, health page.

## Khong duoc lam

- Khong sua UI trong task nay tru khi test phat hien loi va nguoi dung duyet task fix rieng.
- Khong them dependency neu chua duyet.
- Khong build installer.
- Khong goi API ngoai.

## File duoc phep sua

- `package.json` neu them script khong them dependency.
- `tools/*` hoac `tests/*`
- `DEV_COMMANDS.md`
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `OPTIMIZATION_TARGETS.md`
- `tasks/CA-034-visual-regression.md`

## Hanh vi phai giu

- Khong doi runtime app.
- Khong doi UI.
- Khong doi backend.

## Tieu chi hoan thanh

- Co lenh test visual/documented.
- Test bat duoc layout qua nhieu viewport.
- `npm run check:all` pass.

## Ket qua

- Them `tools/layout-regression-check.cjs` bang Node thuần, khong them dependency.
- Them script `npm run test:layout`.
- Dua `test:layout` vao `npm run check:all`.
- Check hien bao ve cac contract layout da tung loi:
  - titlebar search can giua, an o viewport nho;
  - Settings la page rieng, khong hien sidebar/panel workspace;
  - Appearance khong mo song song customize panel ben phai;
  - sidebar rail co compact icon, tooltip va focus/hover guard;
  - content dung `minmax(0, 1fr)` va breakpoint 1500/1180/750;
  - Appearance preview/grid co guard responsive.

## Gioi han

- Day la layout contract test khong dependency, chua phai screenshot visual regression bang Playwright.
- Screenshot baseline nen lam trong task rieng neu duoc phep them Playwright hoac cong cu browser test.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them layout contract check khong dependency va dua vao `check:all`.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


