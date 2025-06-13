#[cfg(target_os = "macos")]
use nix::sys::signal::{kill, Signal};
#[cfg(target_os = "macos")]
use nix::unistd::Pid;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::CloseHandle;
#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::HANDLE;
#[cfg(target_os = "windows")]
use windows_sys::Win32::System::Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE};

static PID_MAP: Lazy<Mutex<HashMap<String, u32>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub struct PidManager;

impl PidManager {
    pub fn set_pid(key: &str, pid: u32) {
        let mut map = PID_MAP.lock().unwrap();
        map.insert(key.to_string(), pid);
    }

    pub fn get_pid(key: &str) -> Option<u32> {
        let map = PID_MAP.lock().unwrap();
        map.get(key).copied()
    }

    pub fn remove_pid(key: &str) {
        let mut map = PID_MAP.lock().unwrap();
        map.remove(key);
    }

    pub fn kill_pid(key: &str) -> std::io::Result<()> {
        if let Some(pid) = Self::get_pid(key) {
            #[cfg(target_os = "macos")]
            {
                let _ = kill(Pid::from_raw(pid as i32), Signal::SIGKILL);
            }
            #[cfg(target_os = "windows")]
            {
                unsafe {
                    let handle: HANDLE = OpenProcess(PROCESS_TERMINATE, 0, pid);
                    if handle != 0 {
                        TerminateProcess(handle, 1);
                        CloseHandle(handle);
                    }
                }
            }
            Self::remove_pid(key);
        }
        Ok(())
    }
}
