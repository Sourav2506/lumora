use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None,
            ),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let show = MenuItem::with_id(
                app,
                "show",
                "Show PERGE",
                true,
                None::<&str>,
            )?;

            let quit = MenuItem::with_id(
                app,
                "quit",
                "Quit",
                true,
                None::<&str>,
            )?;

            let menu = Menu::with_items(
                app,
                &[&show, &quit],
            )?;

            let app_handle = app.handle().clone();

            let _tray = TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .unwrap()
                        .clone(),
                )
                .menu(&menu)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) =
                                app.get_webview_window("main")
                            {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }

                        "quit" => {
                            app.exit(0);
                        }

                        _ => {}
                    }
                })
                .build(app)?;

            if let Some(window) =
                app_handle.get_webview_window("main")
            {
                let app_clone =
                    app_handle.clone();

                window.on_window_event(
                    move |event| {
                        if let tauri::WindowEvent::CloseRequested {
                            api,
                            ..
                        } = event
                        {
                            api.prevent_close();

                            if let Some(window) =
                                app_clone
                                    .get_webview_window(
                                        "main",
                                    )
                            {
                                let _ = window.hide();
                            }
                        }
                    },
                );
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(
                            log::LevelFilter::Info,
                        )
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect(
            "error while running tauri application",
        );
}