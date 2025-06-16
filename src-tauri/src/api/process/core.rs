use crate::utils::command::run_command;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub status: String,
    pub cpu: String,
    pub mem: String,
    pub command: String,
}

pub struct ProcessHandler;

impl ProcessHandler {
    #[cfg(target_os = "macos")]
    pub fn get_process_info_by_word(
        app_handle: &AppHandle,
        keyword: &str,
    ) -> Result<Vec<ProcessInfo>> {
        let output_str = run_command(app_handle, "cmd_output", "ps", &["aux"])?;

        let processes: Vec<ProcessInfo> = output_str
            .lines()
            .skip(1) // 跳过标题行
            .filter(|line| line.to_lowercase().contains(&keyword.to_lowercase()))
            .filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 11 {
                    Some(ProcessInfo {
                        pid: parts[1].parse().unwrap_or(0),
                        status: parts[7].to_string(), // STAT列
                        cpu: parts[2].to_string(),
                        mem: parts[3].to_string(),
                        command: parts[10..].join(" "),
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(processes)
    }

    #[cfg(target_os = "windows")]
    pub fn get_process_info_by_word(
        app_handle: &AppHandle,
        keyword: &str,
    ) -> Result<Vec<ProcessInfo>> {
        // 使用 tasklist 命令获取基本进程信息，添加 /V 参数获取状态信息
        let output_str = run_command(
            app_handle,
            "process_query_tasklist",
            "tasklist",
            &["/FO", "CSV", "/NH", "/V"],
        )?;

        // 使用 wmic 命令获取CPU和内存使用信息
        let wmic_str = run_command(
            app_handle,
            "cmd_output",
            "wmic",
            &[
                "process",
                "get",
                "ProcessId,WorkingSetSize,UserModeTime,CreatingProcessID",
                "/format:csv",
            ],
        )?;

        // 解析 wmic 输出，创建PID到资源使用的映射
        let mut resource_map = std::collections::HashMap::new();
        for line in wmic_str.lines().skip(1) {
            // 跳过标题行
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() >= 4 {
                if let (Ok(pid), Ok(memory), Ok(cpu_time)) = (
                    parts[1].trim().parse::<u32>(),
                    parts[2].trim().parse::<u64>(),
                    parts[3].trim().parse::<u64>(),
                ) {
                    let memory_mb = memory / 1024 / 1024;
                    let cpu_percent = (cpu_time as f64 / 10000000.0).min(100.0);
                    resource_map.insert(pid, (cpu_percent, memory_mb));
                }
            }
        }

        let processes: Vec<ProcessInfo> = output_str
            .lines()
            .filter(|line| line.to_lowercase().contains(&keyword.to_lowercase()))
            .filter_map(|line| {
                let parts: Vec<&str> = line.split(',').map(|s| s.trim_matches('"')).collect();

                if parts.len() >= 6 {
                    let pid = parts[1].parse().unwrap_or(0);
                    let (cpu, mem) = resource_map.get(&pid).copied().unwrap_or((0.0, 0));

                    Some(ProcessInfo {
                        pid,
                        status: parts[5].to_string(), // Windows状态列
                        cpu: format!("{:.1}", cpu),
                        mem: format!("{}", mem),
                        command: parts[0].to_string(),
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(processes)
    }
}
