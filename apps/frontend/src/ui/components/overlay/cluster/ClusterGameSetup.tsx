import type { CreateCluster, Loader, VersionType } from '@onelauncher/client/bindings';
import { TextInputIcon } from '@untitled-theme/icons-solid';
import { bridge } from '~imports';
import Checkbox from '~ui/components/base/Checkbox';
import Dropdown from '~ui/components/base/Dropdown';
import SelectList from '~ui/components/base/SelectList';
import TextField from '~ui/components/base/TextField';
import LoaderIcon from '~ui/components/game/LoaderIcon';
import { formatVersionRelease, LOADERS } from '~utils';
import { createEffect, createMemo, createResource, createSignal, For, Index, type JSX, onMount, Show, splitProps, untrack } from 'solid-js';
import { type ClusterStepProps, createClusterStep } from './ClusterCreationModal';

type PartialCluster = Partial<CreateCluster>;
type PartialClusterUpdateFunc = <K extends keyof PartialCluster>(key: K, value: PartialCluster[K]) => void;

export default createClusterStep({
	message: 'Game Setup',
	buttonType: 'create',
	Component: ClusterGameSetup,
});

function _epicHardcodedLoaderVersionFilter(loader: Loader, version: string): boolean {
	if (loader === 'vanilla')
		return true;

	const split = version.split('.')[1];
	if (split === undefined)
		return true;

	const minor = Number.parseInt(split);
	if (minor < 13)
		return loader === 'forge' || loader === 'legacyfabric';
	else
		return loader === 'forge' || loader === 'fabric' || loader === 'neoforge' || loader === 'quilt';
}

function ClusterGameSetup(props: ClusterStepProps) {
	const [partialCluster, setPartialCluster] = createSignal<PartialCluster>({
		mod_loader: 'vanilla',
	});

	const requiredProps: (keyof PartialCluster)[] = ['name', 'mc_version', 'mod_loader'];
	const [installError, setInstallError] = createSignal('');
	const [installing, setInstalling] = createSignal(false);

	const updatePartialCluster: PartialClusterUpdateFunc = (key, value) => setPartialCluster(prev => ({ ...prev, [key]: value }));
	const setName = (name: string) => updatePartialCluster('name', name);
	const setVersion = (version: string) => updatePartialCluster('mc_version', version);
	const setLoader = (loader: Loader | string) => updatePartialCluster('mod_loader', loader.toLowerCase() as Loader);

	const getLoaders = createMemo(() => {
		const version = partialCluster().mc_version ?? '';

		return LOADERS.filter(loader => _epicHardcodedLoaderVersionFilter(loader, version));
	});

	createEffect(() => {
		const hasName = (partialCluster().name?.length ?? 0) > 0;
		const hasVersion = (partialCluster().mc_version?.length ?? 0) > 0;
		const hasLoader = (partialCluster().mod_loader?.length ?? 0) > 0;

		props.setCanGoForward(hasName && hasVersion && hasLoader && !installing());
	});

	onMount(() => {
		props.controller.setFinishFunction(() => async () => {
			const untracked = untrack(partialCluster);

			for (const prop of requiredProps)
				if (!untracked[prop])
					throw new Error(`Missing required property ${prop}`);

			if (installing())
				return false;
			setInstalling(true);
			setInstallError('');
			try {
				const result = await bridge.commands.createCluster({
					icon: null,
					icon_url: null,
					loader_version: null,
					package_data: null,
					skip: null,
					skip_watch: null,
					...untracked,
				} as CreateCluster);
				if (result.status === 'error') {
					setInstallError(result.error);
					return false;
				}
				return true;
			}
			catch (error) {
				setInstallError(String(error));
				return false;
			}
			finally { setInstalling(false); }
		});
	});

	return (
		<div class="flex flex-col gap-y-4">
			<p class="text-left text-fg-secondary">Choose a version and loader. Game files are downloaded during installation; an internet connection is required.</p>
			<Show when={installing()}><p class="text-left">Installing Minecraft, please wait…</p></Show>
			<Show when={installError()}><p class="text-left text-danger" role="alert">Installation failed: {installError()}</p></Show>
			<Option header="Name">
				<TextField
					iconLeft={<TextInputIcon />}
					onInput={e => setName(e.target.value)}
					placeholder="Name"
				/>
			</Option>

			<Option header="Versions">
				<VersionSelector setVersion={setVersion} />
			</Option>

			<Option header="Loader">
				<Dropdown onChange={index => setLoader(getLoaders()[index] || 'vanilla')}>
					<For each={getLoaders()}>
						{loader => (
							<Dropdown.Row>
								<div class="flex flex-row gap-x-2">
									<div class="h-4 w-4">
										<LoaderIcon loader={loader} />
									</div>
									<span class="capitalize">{loader}</span>
								</div>
							</Dropdown.Row>
						)}
					</For>
				</Dropdown>
			</Option>
		</div>
	);
}

type VersionReleaseFilters = {
	[key in VersionType]: boolean;
};

function VersionSelector(props: { setVersion: (version: string) => void }) {
	const [versions, { refetch }] = createResource(async () => {
		try {
			const result = await bridge.commands.getMinecraftVersions();
			return result.status === 'ok' ? { list: result.data, error: '' } : { list: [], error: result.error };
		}
		catch (error) {
			return { list: [], error: String(error) };
		}
	});
	const [filteredVersions, setFilteredVersions] = createSignal<bridge.Version[]>([]);
	const [selectedVersion, setSelectedVersion] = createSignal<number[]>([]);
	const [filters, setFilters] = createSignal<VersionReleaseFilters>({
		old_alpha: false,
		old_beta: false,
		release: true,
		snapshot: false,
	});

	function refresh(filters: VersionReleaseFilters, versions: bridge.Version[]) {
		setFilteredVersions(() => {
			if (Object.values(filters).every(value => value === false))
				return versions;

			return versions.filter((version) => {
				return filters[version.type];
			});
		});
	}

	function toggleFilter(name: string) {
		setSelectedVersion([]);
		props.setVersion('');
		setFilters((prev) => {
			return {
				...prev,
				[name]: !prev[name as keyof VersionReleaseFilters],
			};
		});
	}

	function setVersion(index: number | undefined) {
		if (index === undefined)
			return;

		const versions = untrack(() => filteredVersions);
		const version = versions()[index];

		if (version)
			props.setVersion(version.id);
	}

	createEffect(() => {
		refresh(filters(), versions()?.list ?? []);
	});


	return (
		<div class="flex flex-col gap-2">
			<Show when={versions.loading}><p class="text-left">Loading Minecraft versions…</p></Show>
			<Show when={versions()?.error}>
				<div class="text-left text-danger" role="alert">Unable to load versions: {versions()?.error} <button class="underline" onClick={() => refetch()}>Retry</button></div>
			</Show>
			<Show when={!versions.loading && !versions()?.error && filteredVersions().length === 0}>
				<p class="text-left">No versions available for these filters.</p>
			</Show>
			<div class="flex flex-1 flex-row gap-2">
			<SelectList
				class="max-h-40 min-w-3/5"
				selected={selectedVersion()}
				onChange={(indexes) => { setSelectedVersion(indexes); setVersion(indexes[0]); }}
			>
				<Show when={filteredVersions() !== undefined}>
					<Index each={filteredVersions()}>
						{(version, index) => (
							<SelectList.Row index={index}>{version().id}</SelectList.Row>
						)}
					</Index>
				</Show>
			</SelectList>

			<div class="flex flex-1 flex-col gap-y-2 overflow-hidden border border-border/05 rounded-lg bg-component-bg p-2">
				<For each={Object.keys(filters())}>
					{name => (
						<Checkbox
							defaultChecked={filters()[name as VersionType]!}
							onChecked={() => toggleFilter(name)}
						>
							{formatVersionRelease(name as VersionType)}
						</Checkbox>
					)}
				</For>
			</div>
			</div>
		</div>
	);
}

type OptionProps = {
	header: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

function Option(props: OptionProps) {
	const [split, rest] = splitProps(props, ['header', 'class']);

	return (
		<div {...rest} class={`flex flex-col gap-y-2 items-stretch ${split.class || ''}`}>
			<h3 class="text-left text-md text-fg-secondary font-semibold uppercase">{props.header}</h3>
			{/* <div class="max-h-8"> */}
			{props.children}
			{/* </div> */}
		</div>
	);
}
