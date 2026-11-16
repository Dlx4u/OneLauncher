//! Metadata management interface

use crate::State;
pub use interpulse::api::minecraft::VersionManifest;
pub use interpulse::api::modded::Manifest;

// TODO: better error handling
// TODO: fix this lmao

/// Get a [`VersionManifest`] for all available Minecraft versions.
#[tracing::instrument]
pub async fn get_minecraft_versions() -> crate::Result<VersionManifest> {
	let state = State::get().await?;
	// Refresh when opening the installer so older cached manifests do not hide
	// newer versions. Retain the cache when the network is unavailable.
	let cached = state.metadata.read().await.minecraft.clone();
	let fetched = crate::store::Metadata::fetch_minecraft(&state.fetch_semaphore).await;
	let meta = fetched.or(cached).ok_or_else(|| anyhow::anyhow!(
		"Unable to download the Minecraft version list. Check your internet connection and try again."
	))?;
	state.metadata.write().await.minecraft = Some(meta.clone());
	Ok(meta)
}

/// Get a [`Manifest`] for all available Fabric versions.
#[tracing::instrument]
pub async fn get_fabric_versions() -> crate::Result<Manifest> {
	let state = State::get().await?;
	let meta = state
		.metadata
		.read()
		.await
		.fabric
		.clone()
		.ok_or_else(|| anyhow::anyhow!("couldn't get fabric metadata"))?;

	Ok(meta)
}

/// Get a [`Manifest`] for all available Quilt versions.
#[tracing::instrument]
pub async fn get_quilt_versions() -> crate::Result<Manifest> {
	let state = State::get().await?;
	let meta = state
		.metadata
		.read()
		.await
		.quilt
		.clone()
		.ok_or_else(|| anyhow::anyhow!("couldn't get quilt metadata"))?;

	Ok(meta)
}

/// Get a [`Manifest`] for all available Forge versions.
#[tracing::instrument]
pub async fn get_forge_versions() -> crate::Result<Manifest> {
	let state = State::get().await?;
	let meta = state
		.metadata
		.read()
		.await
		.forge
		.clone()
		.ok_or_else(|| anyhow::anyhow!("couldn't get forge metadata"))?;

	Ok(meta)
}

/// Get a [`Manifest`] for all available NeoForge versions.
#[tracing::instrument]
pub async fn get_neoforge_versions() -> crate::Result<Manifest> {
	let state = State::get().await?;
	let meta = state
		.metadata
		.read()
		.await
		.neoforge
		.clone()
		.ok_or_else(|| anyhow::anyhow!("couldn't get neoforge metadata"))?;

	Ok(meta)
}

// /// Get a [`Manifest`] for all available Legacy Fabric versions.
// #[tracing::instrument]
// pub async fn get_legacy_fabric_versions() -> crate::Result<Manifest> {
// 	let state = State::get().await?;
// 	let meta = state
// 		.metadata
// 		.read()
// 		.await
// 		.legacy_fabric
// 		.clone()
// 		.ok_or_else(|| anyhow!("missing legacyfabric metadata"))?;

// 	Ok(meta)
// }
