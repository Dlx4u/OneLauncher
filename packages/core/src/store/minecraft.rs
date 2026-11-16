//! Local, offline Minecraft profiles. No online account tokens are stored.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::constants::AUTH_FILE;

#[derive(Serialize, Deserialize, Debug)]
pub struct MinecraftState {
	pub users: HashMap<Uuid, MinecraftCredentials>,
	pub default_user: Option<Uuid>,
}

/// Minecraft's standard name-based offline UUID (Java UUID.nameUUIDFromBytes).
fn offline_uuid(username: &str) -> Uuid {
	let mut bytes = md5::compute(format!("OfflinePlayer:{username}")).0;
	bytes[6] = (bytes[6] & 0x0f) | 0x30;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	Uuid::from_bytes(bytes)
}

impl MinecraftState {
	pub async fn initialize(
		dirs: &super::Directories,
		io_semaphore: &crate::utils::http::IoSemaphore,
	) -> crate::Result<Self> {
		let path = dirs.caches_dir().await.join(AUTH_FILE);
		Ok(crate::utils::http::read_json(&path, io_semaphore).await.unwrap_or(Self {
			users: HashMap::new(),
			default_user: None,
		}))
	}

	pub async fn save(&self) -> crate::Result<()> {
		let state = crate::State::get().await?;
		let path = state.directories.caches_dir().await.join(AUTH_FILE);
		crate::utils::http::write(&path, &serde_json::to_vec(self)?, &state.io_semaphore).await?;
		Ok(())
	}

	pub async fn add_offline(&mut self, username: &str) -> crate::Result<MinecraftCredentials> {
		if !(3..=16).contains(&username.len()) || !username.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_') {
			return Err(anyhow::anyhow!("Username must be 3–16 letters, digits, or underscores.").into());
		}
		let profile = MinecraftCredentials {
			id: offline_uuid(username),
			username: username.to_owned(),
			access_token: "0".into(),
			refresh_token: String::new(),
			expires: Utc::now(),
		};
		self.users.insert(profile.id, profile.clone());
		self.default_user = Some(profile.id);
		self.save().await?;
		Ok(profile)
	}

	pub async fn get_default(&mut self) -> crate::Result<Option<MinecraftCredentials>> {
		Ok(self.default_user.and_then(|id| self.users.get(&id)).or_else(|| self.users.values().next()).cloned())
	}

	pub async fn remove(&mut self, id: Uuid) -> crate::Result<Option<MinecraftCredentials>> {
		let removed = self.users.remove(&id);
		if self.default_user == Some(id) {
			self.default_user = self.users.keys().next().copied();
		}
		self.save().await?;
		Ok(removed)
	}
}

/// Compatibility shape for the existing launcher bridge; tokens are always dummy values.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct MinecraftCredentials {
	pub id: Uuid,
	pub username: String,
	pub access_token: String,
	pub refresh_token: String,
	pub expires: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn offline_uuid_matches_java() {
		assert_eq!(offline_uuid("Notch").to_string(), "b50ad385-829d-3141-a216-7e7d7539ba7f");
	}
}
