use super::core::{PortInfo, ProcessHandler, ProcessInfo};

#[tauri::command]
pub async fn get_process_info_by_word(
    app_handle: tauri::AppHandle,
    keyword: &str,
) -> Result<Vec<ProcessInfo>, String> {
    ProcessHandler::get_process_info_by_word(&app_handle, keyword).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_port_info_by_word(
    app_handle: tauri::AppHandle,
    keyword: &str,
) -> Result<Vec<PortInfo>, String> {
    ProcessHandler::get_port_info_by_word(&app_handle, keyword).map_err(|e| e.to_string())
}
