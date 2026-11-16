import type { MinecraftCredentials } from '@onelauncher/client/bindings';
import { bridge } from '~imports';
import Button from '~ui/components/base/Button';
import TextField from '~ui/components/base/TextField';
import useCommand, { tryResult } from '~ui/hooks/useCommand';
import { type Context, createContext, createSignal, type ParentProps, type Resource, useContext } from 'solid-js';
import Modal, { createModal, type ModalProps } from '../Modal';

interface AccountControllerContextFunc {
	displayAddAccount: () => void;
	refetch: () => void;
	accounts: Resource<MinecraftCredentials[]>;
	defaultAccount: Resource<MinecraftCredentials | null>;
	setDefaultAccount: (uuid: string | null) => Promise<void>;
	removeAccount: (uuid: string, force?: boolean) => Promise<void>;
}

const AccountControllerContext = createContext<AccountControllerContextFunc>() as Context<AccountControllerContextFunc>;

export function AccountControllerProvider(props: ParentProps) {
	const [accounts, { refetch: refetchAccounts }] = useCommand(() => bridge.commands.getUsers());
	const [defaultAccount, { refetch: refetchDefaultAccount }] = useCommand(() => bridge.commands.getDefaultUser(true));

	const [deleteModalUuid, setDeleteModalUuid] = createSignal<string>();

	const addAccountModal = createModal(props => (
		<AddAccountModal {...props} refetch={refetch} />
	));

	const deleteAccountModal = createModal(props => (
		<Modal.Delete
			{...props}
			children="Are you sure you want to remove this account?"
			deleteBtnText="Remove $1"
			name="Account"
			onDelete={() => _forceRemoveAccount(deleteModalUuid())}
			timeLeft={0}
			title="Remove Account"
		/>
	));

	function refetch() {
		refetchAccounts();
		refetchDefaultAccount();
	}

	async function setDefaultAccount(uuid: string | null) {
		await tryResult(() => bridge.commands.setDefaultUser(uuid)).then(refetch);
	}

	async function removeAccount(uuid: string, force?: boolean) {
		if (force !== true) {
			setDeleteModalUuid(uuid);
			deleteAccountModal.show();
		}
		else { await _forceRemoveAccount(uuid); }
	}

	async function _forceRemoveAccount(uuid: string | undefined) {
		if (uuid === undefined)
			return;

		await tryResult(() => bridge.commands.removeUser(uuid));
		refetch();
	}

	const func: AccountControllerContextFunc = {
		displayAddAccount: () => addAccountModal.show(),
		refetch,
		accounts,
		defaultAccount,
		setDefaultAccount,
		removeAccount,
	};

	return (
		<AccountControllerContext.Provider value={func}>
			{props.children}
		</AccountControllerContext.Provider>
	);
}

export function useAccountController() {
	return useContext(AccountControllerContext);
}

export default useAccountController;

interface AddAccountModalProps extends ModalProps {
	refetch: () => void;
}

function AddAccountModal(p: AddAccountModalProps) {
	const [modalProps, props] = Modal.SplitProps(p);
	const [username, setUsername] = createSignal('');
	const [error, setError] = createSignal('');
	const [busy, setBusy] = createSignal(false);

	async function add() {
		setBusy(true);
		try {
			const result = await bridge.commands.authLogin(username());
			if (result.status === 'error') {
				setError(result.error);
				return;
			}
			props.refetch();
			modalProps.hide();
		}
		finally { setBusy(false); }
	}

	return (
		<Modal.Simple
			{...modalProps}
			buttons={[
				<Button buttonStyle="secondary" children="Cancel" onClick={() => modalProps.hide()} />,
				<Button buttonStyle="primary" children="Add" disabled={busy()} onClick={add} />,
			]}
			title="Add offline profile"
		>
			<div class="max-w-120 flex flex-col gap-y-3 line-height-normal">
				<p>Choose a local username. Offline profiles cannot join servers requiring Microsoft authentication.</p>
				<TextField placeholder="Minecraft username" value={username()} onInput={e => setUsername(e.currentTarget.value)} />
				<p class="text-danger">{error()}</p>
			</div>
		</Modal.Simple>
	);
}
