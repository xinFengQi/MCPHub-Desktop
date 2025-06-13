use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub user: String,
    pub cpu: String,
    pub mem: String,
    pub command: String,
}

pub struct ProcessHandler;

impl ProcessHandler {
    #[cfg(target_os = "macos")]
    pub fn get_process_info_by_word(keyword: &str) -> Result<Vec<ProcessInfo>> {
        let output = Command::new("ps").args(["aux"]).output()?;

        let output_str = String::from_utf8(output.stdout)?;

        let processes: Vec<ProcessInfo> = output_str
            .lines()
            .skip(1) // 跳过标题行
            .filter(|line| line.to_lowercase().contains(&keyword.to_lowercase()))
            .filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 11 {
                    Some(ProcessInfo {
                        user: parts[0].to_string(),
                        pid: parts[1].parse().unwrap_or(0),
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
    pub fn get_process_info_by_word(keyword: &str) -> Result<Vec<ProcessInfo>> {
        // 使用 tasklist 命令获取基本进程信息
        let output = Command::new("tasklist")
            .args(["/FO", "CSV", "/NH"])
            .output()?;

        let output_str = String::from_utf8(output.stdout)?;

        // 使用 wmic 命令获取CPU和内存使用信息
        let wmic_output = Command::new("wmic")
            .args([
                "process",
                "get",
                "ProcessId,WorkingSetSize,UserModeTime,CreatingProcessID",
                "/format:csv",
            ])
            .output()?;

        let wmic_str = String::from_utf8(wmic_output.stdout)?;

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
                    // 将内存从字节转换为MB
                    let memory_mb = memory / 1024 / 1024;
                    // CPU使用时间转换为百分比（粗略估计）
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

                if parts.len() >= 2 {
                    let pid = parts[1].parse().unwrap_or(0);
                    let (cpu, mem) = resource_map.get(&pid).copied().unwrap_or((0.0, 0));

                    Some(ProcessInfo {
                        user: "N/A".to_string(), // Windows默认不显示用户名
                        pid,
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
