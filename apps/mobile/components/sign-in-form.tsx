import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { LoginHeroCovers } from '@/components/auth/login-hero-covers';
import { OtpVerifyForm } from '@/components/auth/otp-verify-form';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { useEmailOtpSignIn } from '@/hooks/useEmailOtpSignIn';
import { APP_NAME, LOGIN_HEADLINE, LOGIN_SUBTITLE } from '@/lib/constants/app';
import { cn } from '@/lib/utils';
import { Headphones } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_HEIGHT_RATIO = 0.52;
/** Where scroll content starts — overlaps hero shapes, below card cluster */
const CONTENT_TOP_RATIO = 0.4;

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

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardInset();
  const scrollRef = React.useRef<ScrollView>(null);

  const heroHeight = windowHeight * HERO_HEIGHT_RATIO;
  const contentPaddingTop = Math.max(insets.top + 8, windowHeight * CONTENT_TOP_RATIO);

  const scrollPaddingBottom =
    Math.max(insets.bottom, 16) +
    (isKeyboardVisible ? Math.max(keyboardHeight - insets.bottom, 0) + 12 : 0);

  const scrollFormIntoView = React.useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  React.useEffect(() => {
    if (step !== 'otp') return;
    const timer = setTimeout(scrollFormIntoView, 150);
    return () => clearTimeout(timer);
  }, [step, scrollFormIntoView]);

  React.useEffect(() => {
    if (!isKeyboardVisible) return;
    const timer = setTimeout(scrollFormIntoView, 50);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, scrollFormIntoView]);

  return (
    <View className="flex-1 bg-background">
      <View className="absolute left-0 right-0 top-0" style={{ height: heroHeight }}>
        <LoginHeroCovers className="h-full" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingTop: contentPaddingTop,
            paddingBottom: scrollPaddingBottom,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View className="z-10">
            <View className="mb-4 flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-card shadow-pop">
                <Icon
                  as={Headphones}
                  className="size-4 text-secondary-foreground"
                  strokeWidth={2.5}
                />
              </View>
              <Text className="text-xl font-bold tracking-tight">{APP_NAME}</Text>
            </View>

            <Text className="text-3xl font-bold leading-tight">
              {LOGIN_HEADLINE}
              {'\n'}
              in your <Text className="text-3xl font-bold text-accent">voice.</Text>
            </Text>
            <Text
              className={cn(
                'mt-1.5 text-sm text-muted-foreground',
                step === 'otp' ? 'mb-4' : 'mb-6',
              )}>
              {LOGIN_SUBTITLE}
            </Text>
          </View>

          <View className="z-10">
            {error ? (
              <View
                className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3"
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
                onFocus={scrollFormIntoView}
              />
            ) : (
              <OtpVerifyForm
                email={email}
                isLoading={isLoading}
                autoFocus
                onSubmit={(value) => {
                  clearError();
                  void verifyCode(value);
                }}
                onResend={() => {
                  clearError();
                  void sendCode(email);
                }}
                onChangeEmail={resetToEmail}
                onFocus={scrollFormIntoView}
              />
            )}

            {!isKeyboardVisible ? (
              <Text className="mt-8 text-center text-xs text-muted-foreground">
                Sign in with a one-time code sent to your email.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
