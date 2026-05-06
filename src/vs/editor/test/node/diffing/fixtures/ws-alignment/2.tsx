import { Nav } from '@fluentui/react';
import { View } from '../../layout/layout';

export const WelcomeView = () => {
	return (
		<View title='Pointer Tools'>
			<Nav
				groups={[
					{
						links: [
							{ name: 'Pointer Standup (Redmond)', url: 'https://vscode-standup.azurewebsites.net', icon: 'JoinOnlineMeeting', target: '_blank' },
							{ name: 'Pointer Standup (Zurich)', url: 'https://stand.azurewebsites.net/', icon: 'JoinOnlineMeeting', target: '_blank' },
							{ name: 'Pointer Errors', url: 'https://errors.code.visualstudio.com', icon: 'ErrorBadge', target: '_blank' },
						]
					}
				]}>
			</Nav>
		</View>
	);
}
