import type { Cluster } from '@onelauncher/client/bindings';
import { useNavigate } from '@solidjs/router';
import { Settings01Icon } from '@untitled-theme/icons-solid';
import referenceArt from '~assets/images/reference-art.jpg';
import { bridge } from '~imports';
import ClusterCover from '~ui/components/game/ClusterCover';
import { useClusterCreator } from '~ui/components/overlay/cluster/ClusterCreationModal';
import { useLaunchCluster } from '~ui/hooks/useCluster';
import useCommand from '~ui/hooks/useCommand';
import { upperFirst } from '~utils';
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import ClusterRoot from './cluster/ClusterRoot';
import styles from './Home.module.scss';

function HomePage() {
	const [clusters, { refetch }] = useCommand(bridge.commands.getClusters);
	const [selectedId, setSelectedId] = createSignal<string>();
	const controller = useClusterCreator();
	const navigate = useNavigate();
	const selected = createMemo(() => {
		const list = clusters() ?? [];
		return list.find(cluster => cluster.uuid === selectedId()) ?? list[0];
	});
	const launch = useLaunchCluster(() => selected()?.uuid);

	onMount(() => {
		const unlisten = bridge.events.clusterPayload.listen(({ payload }) => {
			if (payload.event === 'created' || payload.event === 'deleted' || payload.event === 'inserted')
				refetch();
		});
		onCleanup(() => { unlisten.then(fn => fn()); });
	});

	return (
		<div class={styles.home}>
			<section class={styles.hero}>
				<Show when={selected()} fallback={<h1 class={styles.title}>Choose your version</h1>}>
					{cluster => <h1 class={styles.title}>{cluster().meta.mc_version} {upperFirst(cluster().meta.loader || 'vanilla')}</h1>}
				</Show>
				<p class={styles.subtitle}>{selected()?.meta.name || 'Install Minecraft to start playing'}</p>
				<div class={styles.actions}>
					<Show when={selected()} fallback={<button class={styles.launch} onClick={() => controller.start(true)}>Install Minecraft</button>}>
						<button class={styles.launch} onClick={launch}>Launch</button>
						<button class={styles.settings} aria-label="Version settings" onClick={() => selected() && ClusterRoot.open(navigate, selected()!.uuid)}><Settings01Icon class="h-4 w-4" /></button>
					</Show>
				</div>
			</section>
			<section id="versions" class={styles.versions} aria-label="Installed Minecraft versions">
				<For each={clusters() ?? []}>
					{cluster => <VersionCard cluster={cluster} selected={selected()?.uuid === cluster.uuid} onSelect={() => setSelectedId(cluster.uuid)} />}
				</For>
				<button class={styles.add} aria-label="Install a Minecraft version" title="Install a Minecraft version" onClick={() => controller.start(true)}>
					<span class={styles.dots} aria-hidden="true"><For each={Array.from({ length: 9 })}>{() => <span />}</For></span>
					<span class="text-xs">Install</span>
				</button>
			</section>
		</div>
	);
}

function VersionCard(props: { cluster: Cluster; selected: boolean; onSelect: () => void }) {
	return (
		<button class={styles.card} data-selected={props.selected} onClick={props.onSelect}>
			<ClusterCover class={styles.cover} cluster={props.cluster} fallback={referenceArt} />
			<div class={styles.coverShade} />
			<strong class={styles.cardTitle}>{props.cluster.meta.mc_version} {upperFirst(props.cluster.meta.loader || 'vanilla')}</strong>
		</button>
	);
}

export default HomePage;
