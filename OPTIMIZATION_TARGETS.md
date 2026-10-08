# Optimization Targets

File nay dinh huong toi uu. Khong duoc toi uu cam tinh hoac refactor lon neu khong co task rieng.

## Baseline hien tai

- `npm run check:all` da tung pass voi 30 Vitest va 16 Rust tests.
- Installer `1.0.1` da build duoc.
- Source that nhe; thu muc nang chu yeu la artifact:
  - `node_modules/`
  - `src-tauri/target/`
  - `dist/`
  - installer cu trong bundle.

## Khong tinh la loi performance runtime

- `src-tauri/target` nang: la Rust build artifact.
- `node_modules` nang: la dependency dev.
- Build lan dau Rust lau: binh thuong.
- Installer cu ton tai: chi lam thu muc dev nang.

## Frontend toi uu uu tien

1. Giam re-render do state qua rong trong `App.tsx`.
2. Tach chat flow khoi `App.tsx` khi co task rieng.
3. Tach sidebar/titlebar/layout components neu can sua UI tiep.
4. Them visual test truoc khi don CSS lon.
5. Chi dung `useMemo`, `useCallback`, `React.memo` khi co ly do cu the:
   - computation lap lai dang ke;
   - child render lai khong can thiet;
   - dependency effect khong on dinh;
   - state qua rong lam toan App render lai.

## CSS/UI toi uu uu tien

1. Kiem tra selector trung/lop override cu trong `src/styles.css`.
2. Chia CSS theo khu vuc sau khi component da tach on dinh.
3. Giu shadow nhe, tranh backdrop/blur qua nhieu tren toan app.
4. Kiem tra sidebar rail, content grid va appearance preview o nhieu kich thuoc.

## Backend toi uu uu tien

1. Giu DB open/seed idempotent.
2. Giam side effect trong lenh doc metadata.
3. Tach `lib.rs` thanh module khi co task rieng.
4. Giu path guard va test symlink/traversal.
5. Khong them async/network/background service neu task khong cho phep.

## Build/dev toi uu uu tien

1. Khong build installer sau moi thay doi UI nho.
2. Dung `CampusAssistantLocal-Dev.exe` hoac `npm run dev:desktop` khi sua UI.
3. Dung `npm run check:all` truoc khi dong task.
4. Build installer chi o cuoi nhom release.

## Can do truoc khi toi uu lon

- Thoi gian khoi dong app.
- Thoi gian init `init_app`.
- So lan render khi doi theme.
- Thoi gian apply theme/background.
- Dung luong thu muc source that khong gom artifact.

Chua co phep do thi khong ket luan "lag do React" hay "lag do Rust".
