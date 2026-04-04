use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

struct BackendState {
    stega_process: Mutex<Option<Child>>,
    crypto_process: Mutex<Option<Child>>,
}

#[tauri::command]
fn get_backend_status() -> bool {
    // Basic stub. A real check would ping the HTTP endpoints.
    true
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let stega_cmd = Command::new("python")
        .current_dir("C:\\Users\\Saket\\Downloads\\StegaStamp")
        .arg("aegis_api.py")
        .spawn()
        .ok();

    let crypto_cmd = Command::new("python")
        .current_dir("C:\\Users\\Saket\\Downloads\\VisualCrypto-main (1)\\VisualCrypto-main\\web_app")
        .arg("app.py")
        .spawn()
        .ok();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BackendState {
            stega_process: Mutex::new(stega_cmd),
            crypto_process: Mutex::new(crypto_cmd),
        })
        .invoke_handler(tauri::generate_handler![get_backend_status])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(move |app_handle, event| {
        if let RunEvent::Exit = event {
            // Cleanup child processes
            if let Some(mut child) = app_handle.state::<BackendState>().stega_process.lock().unwrap().take() {
                let _ = child.kill();
            }
            if let Some(mut child) = app_handle.state::<BackendState>().crypto_process.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
    });
}
