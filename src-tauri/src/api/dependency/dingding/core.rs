use crate::api::dependency::view::InstallStatus;
use crate::utils::command::run_command_stream;
use crate::utils::pid_manager::PidManager;
use crate::APP_STATE_FILENAME;
use anyhow::Result;
use log::trace;
use std::fs;
use tauri_plugin_store::StoreExt;
pub struct DingDingHandler;

const DINGDING_MCP_KEY: &str = "dingding_mcp";

impl DingDingHandler {
    pub async fn detect(app_handle: &tauri::AppHandle) -> Result<InstallStatus> {
        let store = app_handle.store(APP_STATE_FILENAME).unwrap();
        let node_path = store
            .get("node_path")
            .and_then(|s| s.as_str().map(String::from))
            .unwrap_or("".to_owned());
        if node_path.is_empty() {
            return Ok(InstallStatus::Uninstall);
        }
        if let Ok(metadata) = fs::metadata(&node_path) {
            if metadata.is_dir() || metadata.is_symlink() || metadata.is_file() {
                #[cfg(target_os = "macos")]
                let code = run_command_stream(
                    app_handle.clone(),
                    "cmd_output",
                    "which".to_string(),
                    &["tinet-dingtalk-mcp".to_string()],
                )?;
                #[cfg(target_os = "windows")]
                let code = run_command_stream(
                    app_handle.clone(),
                    "cmd_output",
                    "where".to_string(),
                    &["tinet-dingtalk-mcp".to_string()],
                )?;
                if code == 0 {
                    return Ok(InstallStatus::LatestVersion);
                } else {
                    return Ok(InstallStatus::Uninstall);
                }
            }
        }
        Ok(InstallStatus::Uninstall)
    }

    pub async fn install(app_handle: &tauri::AppHandle) -> Result<()> {
        trace!("Installing tinet-dingtalk-mcp via npm");
        let store = app_handle.store(APP_STATE_FILENAME)?;
        let node_path = store
            .get("node_path")
            .and_then(|s| s.as_str().map(String::from))
            .unwrap_or("".to_owned());
        if node_path.is_empty() || fs::metadata(&node_path).is_err() {
            return Err(anyhow::anyhow!(
                "Node.js 未安装或 node_path 不存在，无法安装 tinet-dingtalk-mcp"
            ));
        }
        #[cfg(target_os = "macos")]
        let npm_cmd = {
            let mut npm_path = format!("{}/bin/npm", node_path);
            let code = run_command_stream(
                app_handle.clone(),
                "cmd_output",
                "which".to_string(),
                &["npm".to_string()],
            );
            if let Ok(0) = code {
                npm_path = "npm".to_string();
            }
            npm_path
        };
        #[cfg(target_os = "windows")]
        let npm_cmd = {
            let mut npm_path = format!("{}\\npm.cmd", node_path);
            let code = run_command_stream(
                app_handle.clone(),
                "cmd_output",
                "where".to_string(),
                &["npm".to_string()],
            );
            if let Ok(0) = code {
                npm_path = "npm".to_string();
            }
            npm_path
        };
        let code = run_command_stream(
            app_handle.clone(),
            "cmd_output",
            npm_cmd.clone(),
            &[
                "install".to_string(),
                "-g".to_string(),
                "tinet-dingtalk-mcp@latest".to_string(),
            ],
        )?;
        if code == 0 {
            trace!("tinet-dingtalk-mcp installed successfully");
        } else {
            return Err(anyhow::anyhow!("npm install failed, exit code: {}", code));
        }
        trace!("All done");
        Ok(())
    }

    pub async fn is_start(_app_handle: &tauri::AppHandle) -> Result<bool> {
        if let Some(pid) = PidManager::get_pid(DINGDING_MCP_KEY) {
            #[cfg(target_os = "macos")]
            {
                use nix::sys::signal::kill;
                use nix::unistd::Pid;
                if kill(Pid::from_raw(pid as i32), None).is_ok() {
                    return Ok(true);
                }
            }
            #[cfg(target_os = "windows")]
            {
                use windows_sys::Win32::Foundation::CloseHandle;
                use windows_sys::Win32::System::Threading::{
                    OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
                };
                unsafe {
                    let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
                    if handle != 0 {
                        CloseHandle(handle);
                        return Ok(true);
                    }
                }
            }
        }
        Ok(false)
    }

    async fn start(app_handle: &tauri::AppHandle) -> Result<()> {
        if let Some(pid) = PidManager::get_pid(DINGDING_MCP_KEY) {
            #[cfg(target_os = "macos")]
            {
                use nix::sys::signal::kill;
                use nix::unistd::Pid;
                if kill(Pid::from_raw(pid as i32), None).is_ok() {
                    return Ok(());
                }
            }
            #[cfg(target_os = "windows")]
            {
                use windows_sys::Win32::Foundation::CloseHandle;
                use windows_sys::Win32::System::Threading::{
                    OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
                };
                unsafe {
                    let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
                    if handle != 0 {
                        CloseHandle(handle);
                        return Ok(());
                    }
                }
            }
        }
        #[cfg(target_os = "macos")]
        let _pid = crate::utils::command::run_command_background_stream(
            app_handle.clone(),
            "cmd_output",
            "tinet-dingtalk-mcp",
            &["--sse"],
            DINGDING_MCP_KEY,
        )?;
        #[cfg(target_os = "windows")]
        let _pid = crate::utils::command::run_command_background_stream(
            app_handle.clone(),
            "cmd_output",
            "tinet-dingtalk-mcp.cmd",
            &["--sse"],
            DINGDING_MCP_KEY,
        )?;
        Ok(())
    }

    pub async fn stop(_app_handle: &tauri::AppHandle) -> Result<()> {
        trace!("Stopping tinet-dingtalk-mcp");
        PidManager::kill_pid(DINGDING_MCP_KEY)?;
        Ok(())
    }

    pub async fn check_and_start(app_handle: &tauri::AppHandle) -> Result<()> {
        let status = Self::detect(app_handle).await?;
        match status {
            InstallStatus::Installing | InstallStatus::Update | InstallStatus::LatestVersion => {
                Self::start(app_handle).await
            }
            _ => Err(anyhow::anyhow!("tinet-dingtalk-mcp 未安装，无法启动服务")),
        }
    }
}
