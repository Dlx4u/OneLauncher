import type { Cluster } from '@onelauncher/client/bindings';
import { useNavigate } from '@solidjs/router';
import { PlayIcon, PlusIcon, Settings01Icon } from '@untitled-theme/icons-solid';
import { bridge } from '~imports';
import Button from '~ui/components/base/Button';
import ClusterCover from '~ui/components/game/ClusterCover';
import { useClusterCreator } from '~ui/components/overlay/cluster/ClusterCreationModal';
import { useLaunchCluster } from '~ui/hooks/useCluster';
import useCommand from '~ui/hooks/useCommand';
import { upperFirst } from '~utils';
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import ClusterRoot from './cluster/ClusterRoot';

/** The cards represent real launcher instances, never a hard-coded version catalogue. */
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
		<div class="min-h-full flex flex-col justify-between gap-10 pb-8 pt-14 text-white">
			<section class="max-w-160 flex flex-1 flex-col items-start justify-center gap-3 py-12">
				<p class="text-xs text-white/70 font-semibold uppercase tracking-[0.2em]">Your Minecraft launcher</p>
				<Show when={selected()} fallback={<h1 class="text-5xl font-bold">Your next adventure<br />starts here.</h1>}>
					{cluster => <h1 class="text-5xl font-bold">{cluster().meta.mc_version} {upperFirst(cluster().meta.loader || 'vanilla')}</h1>}
				</Show>
				<p class="text-white/75">{selected()?.meta.name || 'Install a Minecraft version to get started.'}</p>
				<div class="mt-2 flex items-center gap-3">
					<Show when={selected()} fallback={<Button buttonStyle="primary" iconLeft={<PlusIcon />} onClick={() => controller.start(true)}>Install Minecraft</Button>}>
						<Button buttonStyle="primary" iconLeft={<PlayIcon />} onClick={launch}>Launch</Button>
						<Button buttonStyle="iconSecondary" aria-label="Instance settings" onClick={() => selected() && ClusterRoot.open(navigate, selected()!.uuid)}><Settings01Icon /></Button>
					</Show>
				</div>
			</section>

			<section id="versions" class="flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Installed versions</h2>
					<button class="text-sm text-white/80 hover:text-white" onClick={() => controller.start(false)}>Import instance</button>
				</div>
				<div class="flex gap-4 overflow-x-auto pb-2">
					<For each={clusters() ?? []}>
						{cluster => <VersionCard cluster={cluster} selected={selected()?.uuid === cluster.uuid} onSelect={() => setSelectedId(cluster.uuid)} />}
					</For>
					<button class="min-h-36 min-w-36 flex flex-col items-center justify-center gap-2 border border-white/20 rounded-xl bg-black/30 px-5 text-white hover:bg-white/15" onClick={() => controller.start(true)}>
						<PlusIcon class="h-7 w-7" />
						<span class="text-sm font-medium">Install version</span>
					</button>
				</div>
			</section>
		</div>
	);
}

function VersionCard(props: { cluster: Cluster; selected: boolean; onSelect: () => void }) {
	return (
		<button
			class="group relative h-36 min-w-60 overflow-hidden border-2 rounded-xl text-left transition-colors"
			classList={{ 'border-[#7164ff]': props.selected, 'border-transparent hover:border-white/50': !props.selected }}
			onClick={props.onSelect}
		>
			<ClusterCover class="absolute inset-0 h-full w-full object-cover" cluster={props.cluster} />
			<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
			<div class="absolute bottom-3 left-4 right-3 flex flex-col">
				<strong class="text-lg text-white">{props.cluster.meta.mc_version} {upperFirst(props.cluster.meta.loader || 'vanilla')}</strong>
				<span class="truncate text-xs text-white/75">{props.cluster.meta.name}</span>
			</div>
		</button>
	);
}

export default HomePage;
