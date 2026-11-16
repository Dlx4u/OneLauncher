import type { ParentProps } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import homeBackdrop from '~assets/images/default_instance_cover.jpg';
import useSettings from '~ui/hooks/useSettings';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-solid';
import AnimatedRoutes from '../components/AnimatedRoutes';
import Navbar from '../components/Navbar';

function App(props: ParentProps) {
	const { settings } = useSettings();
	const navigate = useNavigate();
	const location = useLocation();

	if (settings().onboarding_completed !== true)
		navigate('/onboarding');

	return (
		<div
			class="h-full flex flex-col"
			style={location.pathname === '/' ? { 'background-image': `linear-gradient(90deg, rgba(8,14,26,.91), rgba(8,14,26,.3)), linear-gradient(0deg, rgba(8,14,26,.95), transparent 60%), url(${homeBackdrop})`, 'background-size': 'cover', 'background-position': 'center' } : {}}
		>
			<div class="flex flex-col px-8">
				<Navbar />
			</div>

			<div class="h-full w-full overflow-hidden">
				<div class="relative h-full w-full flex flex-col overflow-x-hidden pb-8">
					<OverlayScrollbarsComponent class="os-hide-horizontal-scrollbar absolute left-0 top-0 h-full w-full flex flex-col overflow-x-hidden overflow-y-auto px-8">
						<div class="h-full flex-1">
							<AnimatedRoutes>
								{props.children}
							</AnimatedRoutes>
						</div>
					</OverlayScrollbarsComponent>
				</div>
			</div>
		</div>
	);
}

export default App;
