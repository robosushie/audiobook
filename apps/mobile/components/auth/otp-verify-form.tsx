import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ArrowRight, KeyRound } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type OtpVerifyFormProps = {
  email: string;
  isLoading: boolean;
  autoFocus?: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  onFocus?: () => void;
};

export function OtpVerifyForm({
  email,
  isLoading,
  autoFocus,
  onSubmit,
  onResend,
  onChangeEmail,
  onFocus,
}: OtpVerifyFormProps) {
  const [code, setCode] = React.useState('');

  function handleSubmit() {
    onSubmit(code);
  }

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  }

  return (
    <View className="gap-4">
      <Text className="text-sm text-muted-foreground">
        We sent a verification code to{' '}
        <Text className="font-medium text-foreground">{email}</Text>.
      </Text>

      <View className="gap-3">
        <View className="relative">
          <View className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
            <Icon as={KeyRound} className="size-4 text-muted-foreground" />
          </View>
          <Input
            value={code}
            onChangeText={handleCodeChange}
            placeholder="6-digit code"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            editable={!isLoading}
            maxLength={6}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            autoFocus={autoFocus}
            onFocus={onFocus}
            className="h-12 rounded-2xl border-transparent bg-muted pl-11 text-base tracking-widest"
          />
        </View>
        <Button
          className={cn(
            'h-12 w-full rounded-2xl bg-accent shadow-pop active:bg-accent/90',
            (isLoading || code.length < 6) && 'opacity-50',
          )}
          disabled={isLoading || code.length < 6}
          onPress={handleSubmit}>
          <Text className="font-semibold text-accent-foreground">
            {isLoading ? 'Verifying…' : 'Verify & sign in'}
          </Text>
          <Icon as={ArrowRight} className="size-4 text-accent-foreground" />
        </Button>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Pressable onPress={onResend} disabled={isLoading}>
          <Text className="text-sm font-medium text-primary">Resend code</Text>
        </Pressable>
        <Pressable onPress={onChangeEmail} disabled={isLoading}>
          <Text className="text-sm text-muted-foreground">Use a different email</Text>
        </Pressable>
      </View>
    </View>
  );
}
