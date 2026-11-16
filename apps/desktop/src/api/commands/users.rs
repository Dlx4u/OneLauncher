use onelauncher::data::MinecraftCredentials;
use onelauncher::minecraft;
use uuid::Uuid;

#[specta::specta]
#[tauri::command]
pub async fn get_users() -> Result<Vec<MinecraftCredentials>, String> {
	Ok(minecraft::users().await?)
}

#[specta::specta]
#[tauri::command]
pub async fn get_user(uuid: Uuid) -> Result<MinecraftCredentials, String> {
	Ok(minecraft::get_user(uuid).await?)
}

#[specta::specta]
#[tauri::command]
pub async fn remove_user(uuid: Uuid) -> Result<(), String> {
	Ok(minecraft::remove_user(uuid).await?)
}

#[specta::specta]
#[tauri::command]
pub async fn get_default_user(
	fallback: Option<bool>,
) -> Result<Option<MinecraftCredentials>, String> {
	let uuid = minecraft::get_default_user().await?;

	if let Some(fallback) = fallback {
		if fallback && uuid.is_none() {
			return Ok(minecraft::users().await?.first().cloned());
		}
	}

	match uuid {
		Some(uuid) => Ok(Some(minecraft::get_user(uuid).await?)),
		None => Ok(None),
	}
}

#[specta::specta]
#[tauri::command]
pub async fn set_default_user(uuid: Option<Uuid>) -> Result<(), String> {
	minecraft::set_default_user(uuid).await?;
	Ok(())
}

#[specta::specta]
#[tauri::command]
pub async fn auth_login(username: String) -> Result<MinecraftCredentials, String> {
	Ok(minecraft::add_offline_user(&username).await?)
}
