import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Mic,
  Square,
  Check,
} from 'lucide-react-native';
import { LANGUAGES, SAMPLE_TEXTS, type VoiceSample } from '@/lib/audio-library/voice-samples';
import { useAudioLibraryStore } from '@/lib/audio-library/store';
import { useRouter } from 'expo-router';

const MAX_DURATION = 15;

export function RecordSampleScreen() {
  const router = useRouter();
  const addVoiceSample = useAudioLibraryStore((s) => s.addVoiceSample);

  const [language, setLanguage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sampleName, setSampleName] = useState('');

  const sampleText = language ? SAMPLE_TEXTS[language] : null;

  const handleSave = () => {
    if (!sampleName.trim()) return;
    const sample: VoiceSample = {
      id: Date.now().toString(),
      name: sampleName.trim(),
      language,
      createdAt: new Date(),
    };
    addVoiceSample(sample);
    setShowSaveModal(false);
    setSampleName('');
    router.back();
  };

  return (
    <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-5">
        <Icon as={ArrowLeft} className="size-4 text-muted-foreground" />
        <Text className="text-sm text-muted-foreground">Back</Text>
      </Pressable>

      <Text className="text-lg font-bold text-foreground mb-5">Record Voice Sample</Text>

      <View className="mb-5">
        <Text className="text-xs font-medium text-muted-foreground mb-1.5">Select Language</Text>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a language…" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      {sampleText && (
        <View className="mb-6 p-4 rounded-xl bg-card border border-border">
          <Text className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
            Read this aloud:
          </Text>
          <Text className="text-sm text-foreground leading-relaxed">{sampleText}</Text>
        </View>
      )}

      {language && (
        <View className="items-center gap-5">
          <View className="relative w-32 h-32 items-center justify-center">
            <View className="absolute inset-0 rounded-full border-[6px] border-secondary" />
            <View
              className="absolute inset-0 rounded-full border-[6px] border-primary"
              style={{
                transform: [{ rotate: '-90deg' }],
                borderStyle: 'solid',
                borderRightColor: isRecording ? 'hsl(0 84.2% 60.2%)' : 'hsl(24 93% 47%)',
              }}
            />
            <View className="items-center justify-center">
              <Text className="text-2xl font-bold text-foreground tabular-nums">{elapsed}s</Text>
              <Text className="text-[10px] text-muted-foreground">/ {MAX_DURATION}s</Text>
            </View>
          </View>

          {isRecording && (
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-destructive" />
              <Text className="text-xs text-destructive font-medium">Recording…</Text>
            </View>
          )}

          <View className="flex-row items-center gap-4">
            {!isRecording && (
              <Pressable
                onPress={() => {
                  setIsRecording(true);
                  setElapsed(0);
                }}
                className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-md"
              >
                <Icon as={Mic} className="size-7 text-primary-foreground" />
              </Pressable>
            )}

            {isRecording && (
              <Pressable
                onPress={() => setIsRecording(false)}
                className="w-16 h-16 rounded-full bg-destructive items-center justify-center shadow-md"
              >
                <Icon as={Square} className="size-6 text-destructive-foreground" />
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowSaveModal(true)}
              className="w-12 h-12 rounded-full bg-secondary items-center justify-center"
            >
              <Icon as={Check} className="size-5 text-foreground" />
            </Pressable>
          </View>
        </View>
      )}

      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Voice Sample</DialogTitle>
          </DialogHeader>
          <View>
            <Text className="text-xs font-medium text-muted-foreground mb-1.5">Sample Name</Text>
            <Input
              value={sampleName}
              onChangeText={setSampleName}
              placeholder="e.g. My Arabic Voice"
            />
          </View>
          <DialogFooter>
            <Button variant="outline" onPress={() => setShowSaveModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleSave} disabled={!sampleName.trim()}>
              <Text>Save</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
}
