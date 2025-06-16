use crate::utils::pid_manager::PidManager;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use tauri::AppHandle;
use tauri::Emitter;

fn emit_command_info<S: AsRef<str>>(
    app_handle: &AppHandle,
    event_name: &str,
    program: &S,
    args: &[S],
) {
    let args_str = args
        .iter()
        .map(|s| s.as_ref().to_string())
        .collect::<Vec<String>>()
        .join(" ");
    let cmd_str = format!("执行命令: {} {}", program.as_ref(), args_str);
    let _ = app_handle.emit(&event_name, cmd_str);
}

/// 实时执行命令并通过事件推送输出，等待命令结束
pub fn run_command_stream<S: AsRef<str>>(
    app_handle: AppHandle,
    event_name: &str,
    program: S,
    args: &[S],
) -> std::io::Result<i32> {
    // 发送命令信息
    emit_command_info(&app_handle, event_name, &program, args);

    let mut child = Command::new(program.as_ref())
        .args(args.iter().map(|s| s.as_ref()))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_handle_clone = app_handle.clone();
    let event_name_err = format!("{}_err", event_name);
    let event_name_clone = event_name.to_string();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_handle_clone.emit(&event_name_clone, line);
            }
        }
    });

    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_handle_clone.emit(&event_name_err, line);
            }
        }
    });

    let status = child.wait()?;
    Ok(status.code().unwrap_or(-1))
}

/// 后台启动服务并推送日志，返回 PID
pub fn run_command_background_stream<S: AsRef<str>>(
    app_handle: AppHandle,
    event_name: &str,
    program: S,
    args: &[S],
    pid_key: &str,
) -> std::io::Result<u32> {
    // 发送命令信息
    emit_command_info(&app_handle, event_name, &program, args);

    let mut child = Command::new(program.as_ref())
        .args(args.iter().map(|s| s.as_ref()))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    let pid = child.id();
    PidManager::set_pid(pid_key, pid);

    if let Some(stdout) = child.stdout.take() {
        let app_handle_clone = app_handle.clone();
        let event_name_clone = event_name.to_string();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_handle_clone.emit(&event_name_clone, line);
                }
            }
        });
    }
    if let Some(stderr) = child.stderr.take() {
        let app_handle_clone = app_handle.clone();
        let event_name_err = format!("{}_err", event_name);
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_handle_clone.emit(&event_name_err, line);
                }
            }
        });
    }
    // child 需要 drop，否则进程会被 wait
    drop(child);
    Ok(pid)
}

/// 同步执行命令并返回结果
pub fn run_command<S: AsRef<str>>(
    app_handle: &AppHandle,
    event_name: &str,
    program: S,
    args: &[S],
) -> std::io::Result<String> {
    // 发送命令信息
    emit_command_info(app_handle, event_name, &program, args);

    let output = Command::new(program.as_ref())
        .args(args.iter().map(|s| s.as_ref()))
        .output()?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    // 发送stderr日志
    if !stderr.is_empty() {
        let _ = app_handle.emit(&format!("{}_err", event_name), stderr);
    }
    // 发送stdout日志
    if !stdout.is_empty() {
        let _ = app_handle.emit(event_name, &stdout);
    }

    Ok(stdout)
}
