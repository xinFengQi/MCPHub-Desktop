use super::core::{ProcessHandler, ProcessInfo};

#[tauri::command]
pub async fn get_process_info_by_word(keyword: &str) -> Result<Vec<ProcessInfo>, String> {
    ProcessHandler::get_process_info_by_word(keyword).map_err(|e| e.to_string())
}
