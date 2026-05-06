import { Stack, Text } from '@fluentui/react';
import { View } from '../../layout/layout';

export const WelcomeView = () => {
	return (
		<View title='Pointer Tools'>
			<Stack grow={true} verticalFill={true}>
				<Stack.Item>
					<Text>
						Welcome to the Pointer Tools application.
					</Text>
				</Stack.Item>
			</Stack>
		</View>
	);
}
