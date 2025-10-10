import { Text, View, FlatList, ScrollView, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@clerk/clerk-expo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ProgressLog = {
  _id: Id<'progress'>;
  logDate: string;
  clean: boolean;
  journal?: string;
  mood?: 'Joyful' | 'Hopeful' | 'Tempted' | 'Struggling' | 'Peaceful';
  triggers?: string[];
  streak: number;
  createdAt: number;
  updatedAt: number;
};

const moodEmojis = {
  Joyful: '😊',
  Hopeful: '🌟',
  Tempted: '😰',
  Struggling: '💪',
  Peaceful: '🧘',
};

const moodColors = {
  Joyful: 'bg-green-100 text-green-800',
  Hopeful: 'bg-blue-100 text-blue-800',
  Tempted: 'bg-yellow-100 text-yellow-800',
  Struggling: 'bg-orange-100 text-orange-800',
  Peaceful: 'bg-purple-100 text-purple-800',
};

const Journal = () => {
  const { isSignedIn } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const recentProgress = useQuery(api.progress.getRecentProgress, { limit: 90 });

  useEffect(() => {
    if (recentProgress) {
      const sortedLogs = [...recentProgress].sort(
        (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
      );
      setLogs(sortedLogs);
    }
  }, [recentProgress]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <Text className="text-lg text-muted-foreground text-center">
          Please sign in to view your journal.
        </Text>
      </View>
    );
  }

  if (!logs.length) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <Text className="text-2xl font-semibold mb-2 text-foreground">
          No Entries Yet
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          Start logging your progress to build your recovery journal.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-3 bg-background border-b border-border">
        <Text className="text-3xl font-bold text-foreground">Journal</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        contentContainerClassName="px-4 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Card className="mb-4 overflow-hidden">
            <CardContent className="p-4">
              {/* Date and Streak */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground mb-1">
                    {new Date(item.logDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {new Date(item.logDate).getFullYear()}
                  </Text>
                </View>
                <View className="items-end">
                  <View className="bg-green-100 px-3 py-1.5 rounded-full">
                    <Text className="text-sm font-semibold text-green-800">
                      🔥 {item.streak} {item.streak === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </View>
              </View>

              <Separator className="mb-3" />

              {/* Status */}
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl mr-2">{item.clean ? '✅' : '❌'}</Text>
                <Text className="text-base font-medium text-foreground">
                  {item.clean ? 'Clean Day' : 'Reset Day'}
                </Text>
              </View>

              {/* Mood */}
              {item.mood && (
                <View className="mb-3">
                  <Badge
                    className={`self-start ${moodColors[item.mood]}`}
                  >
                    <Text className="text-sm font-medium">
                      {moodEmojis[item.mood]} {item.mood}
                    </Text>
                  </Badge>
                </View>
              )}

              {/* Triggers */}
              {item.triggers && item.triggers.length > 0 && (
                <View className="mb-3">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Triggers
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {item.triggers.map((trigger, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-secondary"
                      >
                        <Text className="text-xs">{trigger}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Journal Entry */}
              {item.journal && (
                <View className="mt-2">
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Journal Entry
                  </Text>
                  <ScrollView
                    className="max-h-40 bg-muted/30 p-3 rounded-lg"
                    nestedScrollEnabled
                  >
                    <Text className="text-sm text-foreground leading-5">
                      {item.journal}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </CardContent>
          </Card>
        )}
        ItemSeparatorComponent={() => <View className="h-0" />}
      />
    </View>
  );
};

export default Journal;