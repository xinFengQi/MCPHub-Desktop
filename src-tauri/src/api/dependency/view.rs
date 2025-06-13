use log::debug;
use serde::{Deserialize, Serialize};

use super::core::{NpmHandler, ResourceHandler, UVHandler};
use super::dingding::core::DingDingHandler;

#[derive(Debug, Serialize, Deserialize)]
pub struct DependencyStatus {
    uv: bool,
    node: bool,
    servers: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum InstallStatus {
    Uninstall,
    Installing,
    Update,
    LatestVersion,
}

#[tauri::command]
pub async fn check_dependency(app_handle: tauri::AppHandle) -> DependencyStatus {
    let status = DependencyStatus {
        uv: UVHandler::detect(&app_handle).await.unwrap_or(false),
        node: NpmHandler::detect(&app_handle).await.unwrap_or(false),
        servers: ResourceHandler::detect(&app_handle).await.unwrap_or(false),
    };
    status
}

#[tauri::command]
pub async fn check_dingding_dependency(app_handle: tauri::AppHandle) -> InstallStatus {
    DingDingHandler::detect(&app_handle)
        .await
        .unwrap_or(InstallStatus::Uninstall)
}

#[tauri::command]
pub async fn check_dingding_install(app_handle: tauri::AppHandle) -> Result<(), String> {
    DingDingHandler::install(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_dingding_is_start(app_handle: tauri::AppHandle) -> bool {
    DingDingHandler::is_start(&app_handle)
        .await
        .unwrap_or(false)
}

#[tauri::command]
pub async fn check_dingding_start(app_handle: tauri::AppHandle) -> Result<(), String> {
    DingDingHandler::check_and_start(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_dingding_stop(app_handle: tauri::AppHandle) -> Result<(), String> {
    DingDingHandler::stop(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_npm(app_handle: tauri::AppHandle) -> Result<(), String> {
    NpmHandler::install(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_uv(app_handle: tauri::AppHandle) -> Result<(), String> {
    UVHandler::install(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_resource(app_handle: tauri::AppHandle) -> bool {
    debug!("Start check_resource in backend");
    ResourceHandler::detect(&app_handle).await.unwrap_or(false)
}
