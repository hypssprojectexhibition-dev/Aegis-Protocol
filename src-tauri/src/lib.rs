use std::process::{Command, Child};
use std::sync::Mutex;
use std::path::PathBuf;
use tauri::{Manager, RunEvent};

struct BackendState {
    children: Mutex<Vec<Child>>,
}

fn project_root() -> PathBuf {
    // In dev mode, the exe is deep inside src-tauri/target/debug.
    // We walk up until we find the "backend" directory.
    let mut dir = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .unwrap_or(std::path::Path::new("."))
        .to_path_buf();

    for _ in 0..8 {
        if dir.join("backend").is_dir() {
            return dir;
        }
        if let Some(parent) = dir.parent() {
            dir = parent.to_path_buf();
        } else {
            break;
        }
    }

    // Fallback: try the known development path
    let fallback = PathBuf::from(r"C:\Users\Saket\Documents\AegisDekstop\Aegis Protocol");
    if fallback.join("backend").is_dir() {
        return fallback;
    }

    dir
}

fn spawn_backend(root: &PathBuf, subdir: &str, script: &str) -> Option<Child> {
    let work_dir = root.join("backend").join(subdir);
    if !work_dir.join(script).exists() {
        eprintln!("[Aegis] Script not found: {:?}/{}", work_dir, script);
        return None;
    }

    println!("[Aegis] Starting {} from {:?}", script, work_dir);

    // Try "python" first, then "python3"
    let child = Command::new("python")
        .current_dir(&work_dir)
        .arg(script)
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .spawn()
        .or_else(|_| {
            Command::new("python3")
                .current_dir(&work_dir)
                .arg(script)
                .stdout(std::process::Stdio::inherit())
                .stderr(std::process::Stdio::inherit())
                .spawn()
        });

    match child {
        Ok(c) => {
            println!("[Aegis] Started {} (PID: {})", script, c.id());
            Some(c)
        }
        Err(e) => {
            eprintln!("[Aegis] Failed to start {}: {}", script, e);
            None
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let root = project_root();
    println!("[Aegis] Project root: {:?}", root);

    let mut children: Vec<Child> = Vec::new();

    // Launch all three Python backends
    if let Some(c) = spawn_backend(&root, "stega", "aegis_api.py") {
        children.push(c);
    }
    if let Some(c) = spawn_backend(&root, "crypto", "app.py") {
        children.push(c);
    }
    if let Some(c) = spawn_backend(&root, "redaction", "redaction_api.py") {
        children.push(c);
    }

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BackendState {
            children: Mutex::new(children),
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |app_handle, event| {
        if let RunEvent::Exit = event {
            let state = app_handle.state::<BackendState>();
            let mut kids = state.children.lock().unwrap();
            for child in kids.iter_mut() {
                println!("[Aegis] Killing backend PID: {}", child.id());
                let _ = child.kill();
            }
            kids.clear();
        }
    });
}
