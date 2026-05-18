import { SignInForm } from '@/components/sign-in-form';
import { View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="flex-1 bg-background">
      <SignInForm />
    </View>
  );
}
