import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ArrowRight, Mail } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type EmailSignInFormProps = {
  isLoading: boolean;
  onSubmit: (email: string) => void;
};

export function EmailSignInForm({ isLoading, onSubmit }: EmailSignInFormProps) {
  const [email, setEmail] = React.useState('');

  function handleSubmit() {
    onSubmit(email);
  }

  return (
    <View className="gap-3">
      <View className="relative">
        <View className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
          <Icon as={Mail} className="size-4 text-muted-foreground" />
        </View>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          className="h-12 rounded-2xl border-transparent bg-muted pl-11 text-base"
        />
      </View>
      <Button
        className={cn(
          'h-12 w-full rounded-2xl bg-accent shadow-pop active:bg-accent/90',
          isLoading && 'opacity-50',
        )}
        disabled={isLoading}
        onPress={handleSubmit}>
        <Text className="font-semibold text-accent-foreground">
          {isLoading ? 'Sending code…' : 'Continue'}
        </Text>
        <Icon as={ArrowRight} className="size-4 text-accent-foreground" />
      </Button>
    </View>
  );
}
