import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Globe,
  SlidersHorizontal,
  ArrowDownAZ,
  ListFilter,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  genres: string[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  languages: string[];
  selectedLang: string;
  onLangChange: (lang: string) => void;
  sortOptions: string[];
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

export function FilterBar({
  genres,
  selectedGenre,
  onGenreChange,
  languages,
  selectedLang,
  onLangChange,
  sortOptions,
  selectedSort,
  onSortChange,
}: FilterBarProps) {
  const genreActive = selectedGenre !== 'All';
  const langActive = selectedLang !== 'All';

  const pillBase =
    'shrink-0 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full';
  const pillActive = 'bg-primary';
  const pillInactive = 'bg-secondary';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row gap-2 px-5 pb-1"
      contentContainerStyle={{ gap: 8 }}
    >
      <Pressable
        onPress={() => {
          onGenreChange('All');
          onLangChange('All');
          onSortChange(sortOptions[0]);
        }}
        className={cn(
          pillBase,
          !genreActive && !langActive ? pillActive : pillInactive
        )}
      >
        <Icon as={ListFilter} className="size-3 text-inherit" />
        <Text
          className={cn(
            'text-xs font-medium',
            !genreActive && !langActive ? 'text-primary-foreground' : 'text-secondary-foreground'
          )}
        >
          All
        </Text>
      </Pressable>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable
            className={cn(
              pillBase,
              genreActive ? pillActive : pillInactive,
              genreActive ? '' : 'opacity-90'
            )}
          >
            <Icon
              as={SlidersHorizontal}
              className={cn('size-3', genreActive ? 'text-primary-foreground' : 'text-secondary-foreground')}
            />
            <Text
              className={cn(
                'text-xs font-medium',
                genreActive ? 'text-primary-foreground' : 'text-secondary-foreground'
              )}
            >
              Genre
            </Text>
            {genreActive && (
              <View className="rounded-full bg-primary-foreground/20 h-4 w-4 items-center justify-center">
                <Text className="text-[9px] text-primary-foreground font-medium">1</Text>
              </View>
            )}
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {genres.map((g) => (
            <DropdownMenuItem
              key={g}
              onPress={() => onGenreChange(g)}
              className={selectedGenre === g ? 'font-bold' : undefined}
            >
              <Text className={cn('text-xs', selectedGenre === g && 'text-primary font-bold')}>
                {g}
              </Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable
            className={cn(
              pillBase,
              langActive ? pillActive : pillInactive
            )}
          >
            <Icon
              as={Globe}
              className={cn('size-3', langActive ? 'text-primary-foreground' : 'text-secondary-foreground')}
            />
            <Text
              className={cn(
                'text-xs font-medium',
                langActive ? 'text-primary-foreground' : 'text-secondary-foreground'
              )}
            >
              Language
            </Text>
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {languages.map((l) => (
            <DropdownMenuItem key={l} onPress={() => onLangChange(l)}>
              <Text className={cn('text-xs', selectedLang === l && 'text-primary font-bold')}>
                {l === 'All' ? 'All Languages' : l}
              </Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable className={cn(pillBase, pillInactive)}>
            <Icon as={ArrowDownAZ} className="size-3 text-secondary-foreground" />
            <Text className="text-xs font-medium text-secondary-foreground">Sort</Text>
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {sortOptions.map((s) => (
            <DropdownMenuItem key={s} onPress={() => onSortChange(s)}>
              <Text className={cn('text-xs', selectedSort === s && 'text-primary font-bold')}>
                {s}
              </Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ScrollView>
  );
}
