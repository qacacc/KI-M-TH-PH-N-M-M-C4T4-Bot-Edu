#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs::OpenOptions;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn main() {
    let project_dir = find_project_dir();
    let log_path = project_dir.join("dev-launcher.log");
    let log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .ok();

    let mut command = Command::new("npm.cmd");
    command
        .current_dir(&project_dir)
        .args(["run", "dev:tauri"])
        .creation_flags(CREATE_NO_WINDOW);

    if let Some(file) = log {
        let stderr = file.try_clone().ok();
        command.stdout(Stdio::from(file));
        if let Some(stderr_file) = stderr {
            command.stderr(Stdio::from(stderr_file));
        }
    } else {
        command.stdout(Stdio::null()).stderr(Stdio::null());
    }

    let _ = command.spawn();
}

fn find_project_dir() -> PathBuf {
    let exe_dir = env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.to_path_buf()));

    if let Some(dir) = exe_dir {
        if dir.join("package.json").exists() && dir.join("src-tauri").exists() {
            return dir;
        }
    }

    PathBuf::from(r"C:\Users\PC\Downloads\bot game")
}
