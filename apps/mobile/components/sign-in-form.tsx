import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { LoginHeroCovers } from '@/components/auth/login-hero-covers';
import { OtpVerifyForm } from '@/components/auth/otp-verify-form';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { APP_NAME, LOGIN_HEADLINE, LOGIN_SUBTITLE } from '@/lib/constants/app';
import { cn } from '@/lib/utils';
import { useEmailOtpSignIn } from '@/hooks/useEmailOtpSignIn';
import { Headphones } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

export function SignInForm() {
  const {
    step,
    email,
    isLoading,
    error,
    sendCode,
    verifyCode,
    resetToEmail,
    clearError,
  } = useEmailOtpSignIn();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <LoginHeroCovers />

        <View className="flex-1 px-7 pb-8 pt-6">
          <View className="mb-5 flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-2xl bg-card shadow-pop">
              <Icon as={Headphones} className="size-4 text-secondary-foreground" strokeWidth={2.5} />
            </View>
            <Text className="text-xl font-bold tracking-tight">{APP_NAME}</Text>
          </View>

          <Text className="text-3xl font-bold leading-tight">
            {LOGIN_HEADLINE}
            {'\n'}
            in your{' '}
            <Text className="text-3xl font-bold text-accent">voice.</Text>
          </Text>
          <Text className="mb-6 mt-1.5 text-sm text-muted-foreground">{LOGIN_SUBTITLE}</Text>

          {error ? (
            <View
              className={cn(
                'mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3',
              )}
              accessibilityRole="alert">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          {step === 'email' ? (
            <EmailSignInForm
              isLoading={isLoading}
              onSubmit={(value) => {
                clearError();
                void sendCode(value);
              }}
            />
          ) : (
            <OtpVerifyForm
              email={email}
              isLoading={isLoading}
              onSubmit={(value) => {
                clearError();
                void verifyCode(value);
              }}
              onResend={() => {
                clearError();
                void sendCode(email);
              }}
              onChangeEmail={() => {
                resetToEmail();
              }}
            />
          )}

          <Text className="mt-auto pt-6 text-center text-xs text-muted-foreground">
            Sign in with a one-time code sent to your email.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
