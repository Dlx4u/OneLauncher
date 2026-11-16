import { bridge } from '~imports';
import Button from '~ui/components/base/Button';
import TextField from '~ui/components/base/TextField';
import useAccountController from '~ui/components/overlay/account/AddAccountModal';
import { createSignal, onMount } from 'solid-js';
import Onboarding from './Onboarding';

function OnboardingLogin() {
	const context = Onboarding.useContext();
	const accountController = useAccountController();
	const [username, setUsername] = createSignal('');
	const [errorMessage, setErrorMessage] = createSignal('');
	const [saved, setSaved] = createSignal(false);

	onMount(() => context.setForwardButtonEnabled(false));

	async function createProfile() {
		const result = await bridge.commands.authLogin(username());
		if (result.status === 'error') {
			setErrorMessage(result.error);
			return;
		}
		setErrorMessage('');
		setSaved(true);
		accountController.refetch();
		context.setForwardButtonEnabled(true);
	}

	return (
		<div class="grid grid-cols-2 h-full w-full flex flex-col items-start justify-center gap-x-16 gap-y-4">
			<h1 class="text-6xl -mb-2">Offline profile</h1>
			<h3>Choose a local username. This profile cannot join servers that require Microsoft authentication.</h3>
			<TextField placeholder="Minecraft username" value={username()} onInput={e => setUsername(e.currentTarget.value)} />
			<Button buttonStyle="secondary" children="Create profile" onClick={createProfile} />
			{saved() && <p>Profile saved. You can continue.</p>}
			<p class="text-danger">{errorMessage()}</p>
		</div>
	);
}

export default OnboardingLogin;
